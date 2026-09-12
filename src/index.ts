import type { PluginContext, PluginApiResponse } from '@openlearn/plugin-sdk';
import { IEventBusServiceToken } from '@openlearn/plugin-sdk';
import { LearnStarSyncService } from './sync-service.js';
import { getAllPetSpecies, calculatePetStageAndLevel } from './pet-data.js';
import type { LearnStarConfig, ClassMapping } from './contracts/index.js';

export default {
  manifest: {
    id: 'openlearn-plugin-learnstar',
    name: 'LearnStar Planet Connector',
    version: '1.0.0',
    main: 'dist/index.js',
    description: '学宠星球 (LearnStar Planet) 官方互通插件 - 课堂行为积分驱动125种学宠进化、名册对齐与大屏互动直达',
    engines: { openlearn: '>=0.3.15' },
    requires: ['@openlearn/core:IEventBusService@^1.0.0'],
    api: {
      routes: [
        { method: 'GET', path: '/config', roles: ['administrator', 'teacher'] },
        { method: 'POST', path: '/config', roles: ['administrator', 'teacher'] },
        { method: 'POST', path: '/test-connection', roles: ['administrator', 'teacher'] },
        { method: 'GET', path: '/classes', roles: ['administrator', 'teacher'] },
        { method: 'POST', path: '/sync-roster', roles: ['administrator', 'teacher'] },
        { method: 'POST', path: '/give-score', roles: ['administrator', 'teacher'] },
        { method: 'GET', path: '/pets-overview', roles: ['administrator', 'teacher', 'student'] },
        { method: 'GET', path: '/pet-species', auth: false },
      ],
    },
  },

  async activate(ctx: PluginContext): Promise<void> {
    ctx.log.info('Activating LearnStar Planet Connector Plugin...');

    // 1. 初始化同步与持久化服务
    const syncService = new LearnStarSyncService(ctx);
    await syncService.init();

    // 2. 注册 OpenLearn 核心事件监听器
    const eventBus = (ctx as any).services?.eventBus || (await ctx.resolve(IEventBusServiceToken));
    if (eventBus) {
      // 监听作业评分完成事件
      eventBus.subscribe('assignment.graded', async (event: any) => {
        const payload = event?.payload || event || {};
        const config = syncService.getConfig();
        if (!config.autoSyncAssignment) return;

        const studentId = payload.studentId || payload.userId;
        const score = payload.score || 0;
        const assignmentTitle = payload.assignmentTitle || '课堂作业';

        if (studentId && score > 0) {
          await syncService.syncScoreToLearnStar({
            openlearnStudentId: String(studentId),
            studentName: payload.studentName,
            score,
            reason: `完成作业「${assignmentTitle}」获得 ${score} 分`,
            eventType: 'assignment.graded',
          });
        }
      });

      // 监听课堂签到考勤事件
      eventBus.subscribe('attendance.recorded', async (event: any) => {
        const payload = event?.payload || event || {};
        const config = syncService.getConfig();
        if (!config.autoSyncAttendance) return;

        const studentId = payload.studentId;
        if (studentId && payload.status === 'present') {
          await syncService.syncScoreToLearnStar({
            openlearnStudentId: String(studentId),
            studentName: payload.studentName,
            score: 5, // 到课默认奖励 5 积分
            reason: '课堂出勤签到奖励',
            eventType: 'attendance.recorded',
          });
        }
      });
      ctx.log.info('LearnStar Planet event listeners subscribed.');
    }

    // ── HTTP API 端点 1: /config (获取与保存配置) ─────────────────────────
    ctx.http.get('/config', async (): Promise<PluginApiResponse<any>> => {
      const config = syncService.getConfig();
      const logs = syncService.listRecentLogs(15);
      const mappings = syncService.listClassMappings();
      return {
        status: 200,
        body: { config, mappings, logs },
      };
    });

    ctx.http.post('/config', async (req: any): Promise<PluginApiResponse<any>> => {
      const newConfig = req.body as LearnStarConfig;
      if (!newConfig || !newConfig.baseUrl) {
        return {
          status: 400,
          body: { error: '学宠星球服务基地址 (baseUrl) 不能为空' },
        };
      }

      syncService.saveConfig(newConfig);
      ctx.log.info(`LearnStar configuration updated: baseUrl=${newConfig.baseUrl} mode=${newConfig.authMode}`);

      return {
        status: 200,
        body: { success: true, config: newConfig },
      };
    });

    // ── HTTP API 端点 2: /test-connection (连通性测试) ─────────────────────
    ctx.http.post('/test-connection', async (req: any): Promise<PluginApiResponse<any>> => {
      const configOverride = req.body as LearnStarConfig;
      const client = configOverride?.baseUrl
        ? new (await import('./client.js')).LearnStarClient(configOverride)
        : syncService.getClient();

      const result = await client.testConnection();
      return {
        status: 200,
        body: result,
      };
    });

    // ── HTTP API 端点 3: /classes (班级与映射列表) ─────────────────────────
    ctx.http.get('/classes', async (): Promise<PluginApiResponse<any>> => {
      const client = syncService.getClient();
      let learnstarClasses: any[] = [];
      try {
        learnstarClasses = await client.listClasses();
      } catch (err: any) {
        ctx.log.warn(`Could not fetch LearnStar classes: ${err.message}`);
      }

      const mappings = syncService.listClassMappings();
      return {
        status: 200,
        body: { mappings, learnstarClasses },
      };
    });

    // ── HTTP API 端点 4: /sync-roster (花名册与班级映射同步) ───────────────
    ctx.http.post('/sync-roster', async (req: any): Promise<PluginApiResponse<any>> => {
      const { mapping, students } = req.body || {};
      if (!mapping || !mapping.openlearnClassId || !mapping.learnstarClassId) {
        return {
          status: 400,
          body: { error: '班级映射参数不完整' },
        };
      }

      syncService.saveClassMapping(mapping as ClassMapping);

      // 如果提供了学生列表，批量同步导入
      let importedCount = 0;
      if (Array.isArray(students) && students.length > 0) {
        const client = syncService.getClient();
        try {
          await client.importStudents(mapping.learnstarClassId, students);
          importedCount = students.length;
          // 保存学生映射
          for (const s of students) {
            if (s.openlearnStudentId && s.learnstarStudentId) {
              syncService.saveStudentMapping({
                openlearnStudentId: s.openlearnStudentId,
                learnstarStudentId: s.learnstarStudentId,
                name: s.name,
                studentNo: s.student_no,
                classId: mapping.openlearnClassId,
              });
            }
          }
        } catch (err: any) {
          ctx.log.warn(`Batch student import partially failed: ${err.message}`);
        }
      }

      return {
        status: 200,
        body: { success: true, importedCount, mapping },
      };
    });

    // ── HTTP API 端点 5: /give-score (手动积分发放与调试) ─────────────────
    ctx.http.post('/give-score', async (req: any): Promise<PluginApiResponse<any>> => {
      const { studentId, studentName, score, reason } = req.body || {};
      if (!studentId || !score) {
        return {
          status: 400,
          body: { error: '缺少必需的 studentId 或 score 参数' },
        };
      }

      const success = await syncService.syncScoreToLearnStar({
        openlearnStudentId: String(studentId),
        studentName,
        score: Number(score),
        reason: reason || '教师手动积分激励',
        eventType: 'manual.reward',
      });

      return {
        status: 200,
        body: { success },
      };
    });

    // ── HTTP API 端点 6: /pets-overview (全班学宠成长概况) ─────────────────
    ctx.http.get('/pets-overview', async (req: any): Promise<PluginApiResponse<any>> => {
      const classId = req.query?.class_id;
      const client = syncService.getClient();

      try {
        const overview = await client.getPetsOverview(classId);
        return {
          status: 200,
          body: overview,
        };
      } catch (err: any) {
        return {
          status: 500,
          body: { error: err.message },
        };
      }
    });

    // ── HTTP API 端点 7: /pet-species (125 种宠物图鉴数据) ────────────────
    ctx.http.get('/pet-species', async (): Promise<PluginApiResponse<any>> => {
      const species = getAllPetSpecies();
      return {
        status: 200,
        body: {
          total: species.length,
          species,
        },
      };
    });

    ctx.log.info('LearnStar Planet Connector Plugin successfully activated!');
  },

  async deactivate(): Promise<void> {
    // 资源注销与清理
  },
};
