import type { PluginContext } from '@openlearn/plugin-sdk';
import { IDatabaseToken } from '@openlearn/plugin-sdk';
import { LearnStarClient } from './client.js';
import type { LearnStarConfig, ClassMapping, StudentMapping } from './contracts/index.js';

export class LearnStarSyncService {
  private configTable = '';
  private classMappingsTable = '';
  private studentMappingsTable = '';
  private syncLogsTable = '';
  private db: any = null;

  constructor(private ctx: PluginContext) {}

  async init(): Promise<void> {
    await this.ctx.db.ensureTable(
      'config',
      'id INTEGER PRIMARY KEY CHECK (id = 1), base_url TEXT NOT NULL, auth_mode TEXT NOT NULL, teacher_username TEXT, teacher_password TEXT, default_class_code TEXT, score_exchange_ratio REAL NOT NULL, auto_sync_assignment INTEGER NOT NULL, auto_sync_attendance INTEGER NOT NULL, updated_at INTEGER NOT NULL'
    );

    await this.ctx.db.ensureTable(
      'class_mappings',
      'openlearn_class_id TEXT PRIMARY KEY, learnstar_class_id TEXT NOT NULL, class_code TEXT, class_name TEXT, last_synced_at INTEGER'
    );

    await this.ctx.db.ensureTable(
      'student_mappings',
      'openlearn_student_id TEXT PRIMARY KEY, learnstar_student_id TEXT NOT NULL, student_no TEXT, name TEXT, class_id TEXT'
    );

    await this.ctx.db.ensureTable(
      'sync_logs',
      'id INTEGER PRIMARY KEY AUTOINCREMENT, event_type TEXT NOT NULL, student_name TEXT, score_delta REAL NOT NULL, reason TEXT, status TEXT NOT NULL, error_msg TEXT, created_at INTEGER NOT NULL'
    );

    this.configTable = this.ctx.db.table('config');
    this.classMappingsTable = this.ctx.db.table('class_mappings');
    this.studentMappingsTable = this.ctx.db.table('student_mappings');
    this.syncLogsTable = this.ctx.db.table('sync_logs');

    this.db = (this.ctx as any).services?.db || (await this.ctx.resolve(IDatabaseToken));
  }

  getConfig(): LearnStarConfig {
    const row = this.db.prepare(`SELECT * FROM ${this.configTable} WHERE id = 1`).get() as any;
    if (!row) {
      return {
        baseUrl: 'http://localhost:8000',
        authMode: 'class_code',
        scoreExchangeRatio: 1.0,
        autoSyncAssignment: true,
        autoSyncAttendance: true,
      };
    }

    return {
      baseUrl: row.base_url,
      authMode: row.auth_mode as any,
      teacherUsername: row.teacher_username || undefined,
      teacherPassword: row.teacher_password || undefined,
      defaultClassCode: row.default_class_code || undefined,
      scoreExchangeRatio: row.score_exchange_ratio,
      autoSyncAssignment: Boolean(row.auto_sync_assignment),
      autoSyncAttendance: Boolean(row.auto_sync_attendance),
    };
  }

  saveConfig(config: LearnStarConfig): void {
    this.db
      .prepare(`
        INSERT INTO ${this.configTable} (id, base_url, auth_mode, teacher_username, teacher_password, default_class_code, score_exchange_ratio, auto_sync_assignment, auto_sync_attendance, updated_at)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          base_url = excluded.base_url,
          auth_mode = excluded.auth_mode,
          teacher_username = excluded.teacher_username,
          teacher_password = excluded.teacher_password,
          default_class_code = excluded.default_class_code,
          score_exchange_ratio = excluded.score_exchange_ratio,
          auto_sync_assignment = excluded.auto_sync_assignment,
          auto_sync_attendance = excluded.auto_sync_attendance,
          updated_at = excluded.updated_at;
      `)
      .run(
        config.baseUrl,
        config.authMode,
        config.teacherUsername || null,
        config.teacherPassword || null,
        config.defaultClassCode || null,
        config.scoreExchangeRatio ?? 1.0,
        config.autoSyncAssignment ? 1 : 0,
        config.autoSyncAttendance ? 1 : 0,
        Date.now()
      );
  }

  getClient(): LearnStarClient {
    return new LearnStarClient(this.getConfig());
  }

  listClassMappings(): ClassMapping[] {
    const rows = this.db.prepare(`SELECT * FROM ${this.classMappingsTable}`).all() as any[];
    return rows.map(r => ({
      openlearnClassId: r.openlearn_class_id,
      learnstarClassId: r.learnstar_class_id,
      classCode: r.class_code || undefined,
      className: r.class_name || undefined,
      lastSyncedAt: r.last_synced_at || undefined,
    }));
  }

  saveClassMapping(mapping: ClassMapping): void {
    this.db
      .prepare(`
        INSERT INTO ${this.classMappingsTable} (openlearn_class_id, learnstar_class_id, class_code, class_name, last_synced_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(openlearn_class_id) DO UPDATE SET
          learnstar_class_id = excluded.learnstar_class_id,
          class_code = excluded.class_code,
          class_name = excluded.class_name,
          last_synced_at = excluded.last_synced_at;
      `)
      .run(
        mapping.openlearnClassId,
        mapping.learnstarClassId,
        mapping.classCode || null,
        mapping.className || null,
        mapping.lastSyncedAt || Date.now()
      );
  }

  getStudentMapping(openlearnStudentId: string): StudentMapping | null {
    const row = this.db
      .prepare(`SELECT * FROM ${this.studentMappingsTable} WHERE openlearn_student_id = ?`)
      .get(openlearnStudentId) as any;
    if (!row) return null;
    return {
      openlearnStudentId: row.openlearn_student_id,
      learnstarStudentId: row.learnstar_student_id,
      studentNo: row.student_no || undefined,
      name: row.name || undefined,
      classId: row.class_id || undefined,
    };
  }

  saveStudentMapping(mapping: StudentMapping): void {
    this.db
      .prepare(`
        INSERT INTO ${this.studentMappingsTable} (openlearn_student_id, learnstar_student_id, student_no, name, class_id)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(openlearn_student_id) DO UPDATE SET
          learnstar_student_id = excluded.learnstar_student_id,
          student_no = excluded.student_no,
          name = excluded.name,
          class_id = excluded.class_id;
      `)
      .run(
        mapping.openlearnStudentId,
        mapping.learnstarStudentId,
        mapping.studentNo || null,
        mapping.name || null,
        mapping.classId || null
      );
  }

  logSync(entry: {
    eventType: string;
    studentName?: string;
    scoreDelta: number;
    reason: string;
    status: 'success' | 'failed';
    errorMsg?: string;
  }): void {
    this.db
      .prepare(`
        INSERT INTO ${this.syncLogsTable} (event_type, student_name, score_delta, reason, status, error_msg, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        entry.eventType,
        entry.studentName || '未知学生',
        entry.scoreDelta,
        entry.reason,
        entry.status,
        entry.errorMsg || null,
        Date.now()
      );
  }

  listRecentLogs(limit = 20): any[] {
    return this.db.prepare(`SELECT * FROM ${this.syncLogsTable} ORDER BY created_at DESC LIMIT ?`).all(limit);
  }

  /**
   * 处理从 OpenLearn 派发过来的积分变动事件并同步至学宠星球
   */
  async syncScoreToLearnStar(params: {
    openlearnStudentId: string;
    studentName?: string;
    score: number;
    reason: string;
    eventType: string;
  }): Promise<boolean> {
    const config = this.getConfig();
    const ratio = config.scoreExchangeRatio || 1.0;
    const petScoreDelta = Math.round(params.score * ratio);

    if (petScoreDelta === 0) return true;

    // 查找学生对齐映射
    let mapping = this.getStudentMapping(params.openlearnStudentId);
    let targetLearnStarId: string | number | null = mapping ? mapping.learnstarStudentId : null;

    if (!targetLearnStarId) {
      // 如果未建映射，回退尝试使用学号或直接将 openlearnStudentId 转为 ID
      targetLearnStarId = params.openlearnStudentId;
    }

    const client = this.getClient();
    try {
      await client.giveScore({
        studentId: targetLearnStarId,
        score: petScoreDelta,
        reason: `[OpenLearn联动] ${params.reason}`,
      });

      this.logSync({
        eventType: params.eventType,
        studentName: params.studentName || params.openlearnStudentId,
        scoreDelta: petScoreDelta,
        reason: params.reason,
        status: 'success',
      });
      this.ctx.log.info(`Synced score to LearnStar: student=${params.studentName} delta=+${petScoreDelta} reason=${params.reason}`);
      return true;
    } catch (err: any) {
      this.logSync({
        eventType: params.eventType,
        studentName: params.studentName || params.openlearnStudentId,
        scoreDelta: petScoreDelta,
        reason: params.reason,
        status: 'failed',
        errorMsg: err.message,
      });
      this.ctx.log.warn(`Failed to sync score to LearnStar: ${err.message}`);
      return false;
    }
  }
}
