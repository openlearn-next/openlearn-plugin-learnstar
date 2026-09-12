/**
 * OpenLearn 与学宠星球 (LearnStar Planet) 跨端数据模型与契约定义
 */

export type PetEvolutionStage = 'egg' | 'baby' | 'growing' | 'mature' | 'legendary' | 'transcendent';

export interface LearnStarConfig {
  /** 学宠星球服务基地址 (e.g. http://localhost:8000 或 https://planet.school.edu) */
  baseUrl: string;
  /** 认证模式: teacher (教师账号凭据模式) | class_code (轻量班级码大屏模式) */
  authMode: 'teacher' | 'class_code';
  /** 教师登录账号 (仅 teacher 模式有效) */
  teacherUsername?: string;
  /** 教师登录密码 (仅 teacher 模式有效) */
  teacherPassword?: string;
  /** 默认班级码 (仅 class_code 模式或快捷大屏模式有效) */
  defaultClassCode?: string;
  /** 缓存的 Sanctum 认证令牌 */
  cachedToken?: string;
  /** 令牌过期时间 */
  tokenExpiresAt?: number;
  /** 积分换算比例 (OpenLearn 积分 -> 学宠星球成长积分，默认 1:1) */
  scoreExchangeRatio?: number;
  /** 作业批改自动同步开关 */
  autoSyncAssignment?: boolean;
  /** 考勤签到自动同步开关 */
  autoSyncAttendance?: boolean;
}

export interface ClassMapping {
  /** OpenLearn 班级 ID */
  openlearnClassId: string;
  /** 学宠星球对应的班级 ID */
  learnstarClassId: string;
  /** 学宠星球班级码 (Class Display Code) */
  classCode?: string;
  /** 班级名称 */
  className?: string;
  /** 上次名册同步时间 */
  lastSyncedAt?: number;
}

export interface StudentMapping {
  openlearnStudentId: string;
  learnstarStudentId: string;
  studentNo?: string;
  name?: string;
  classId?: string;
}

export interface LearnStarStudent {
  id: number | string;
  name: string;
  student_no?: string;
  class_id?: number | string;
  score: number;
  science_coin?: number;
  reading_coin?: number;
  sports_coin?: number;
  pet?: LearnStarPetInfo | null;
}

export interface LearnStarPetInfo {
  id?: number | string;
  student_id: number | string;
  species_id: string;
  species_name?: string;
  custom_name?: string;
  level: number;
  stage: PetEvolutionStage;
  score: number;
  next_score?: number;
}

export interface PetSpeciesMeta {
  id: string;
  name: string;
  seriesId: string;
  seriesName: string;
  emoji: string;
  description?: string;
}
