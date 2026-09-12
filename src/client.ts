import type { LearnStarConfig, LearnStarStudent, LearnStarPetInfo } from './contracts/index.js';

export class LearnStarClient {
  private token: string | null = null;

  constructor(private config: LearnStarConfig) {
    if (config.cachedToken) {
      this.token = config.cachedToken;
    }
  }

  private get baseUrl(): string {
    return (this.config.baseUrl || 'http://localhost:8000').replace(/\/$/, '');
  }

  /**
   * 确保客户端具有有效授权令牌 (Sanctum Token)
   */
  async ensureAuthenticated(): Promise<string> {
    if (this.token) return this.token;

    if (this.config.authMode === 'teacher') {
      if (!this.config.teacherUsername || !this.config.teacherPassword) {
        throw new Error('Teacher credentials missing (username/password required for teacher mode)');
      }

      const res = await fetch(`${this.baseUrl}/api/v1/auth/teacher/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          username: this.config.teacherUsername,
          password: this.config.teacherPassword,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Teacher login failed (${res.status}): ${err.message || res.statusText}`);
      }

      const data = await res.json();
      this.token = data.token || data.access_token || data.data?.token;
      return this.token!;
    } else {
      // class_code 模式
      const classCode = this.config.defaultClassCode;
      if (!classCode) {
        throw new Error('Default class code missing for class_code mode');
      }

      const res = await fetch(`${this.baseUrl}/api/v1/display/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ class_code: classCode }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Class display login failed (${res.status}): ${err.message || res.statusText}`);
      }

      const data = await res.json();
      this.token = data.token || data.data?.token;
      return this.token!;
    }
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.ensureAuthenticated();
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      if (res.status === 401) {
        // Token 失效，清空重试一次
        this.token = null;
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(`LearnStar API error [${res.status}]: ${err.message || res.statusText}`);
    }

    const data = await res.json();
    return data.data !== undefined ? data.data : data;
  }

  /**
   * 测试学宠星球服务连通性
   */
  async testConnection(): Promise<{ success: boolean; message: string; version?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/common/score-categories`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        return { success: true, message: '成功连接至学宠星球服务！' };
      }
      return { success: false, message: `服务响应异常: HTTP ${res.status}` };
    } catch (err: any) {
      return { success: false, message: `无法连接到学宠星球: ${err.message}` };
    }
  }

  /**
   * 获取教师名下管理的班级列表
   */
  async listClasses(): Promise<Array<{ id: number | string; name: string; grade?: number; class_code?: string }>> {
    return this.request('/api/v1/teacher/my-classes');
  }

  /**
   * 获取指定班级的学生名单
   */
  async listStudents(classId?: number | string): Promise<LearnStarStudent[]> {
    const query = classId ? `?class_id=${classId}` : '';
    return this.request(`/api/v1/teacher/students${query}`);
  }

  /**
   * 发放积分驱动宠物成长
   */
  async giveScore(params: {
    studentId: number | string;
    score: number;
    reason: string;
    ruleId?: number | string;
  }): Promise<{ success: boolean; current_score?: number }> {
    if (this.config.authMode === 'class_code') {
      // 教室端快速加分
      return this.request('/api/v1/display/quick-score', {
        method: 'POST',
        body: JSON.stringify({
          student_id: params.studentId,
          score: params.score,
          reason: params.reason,
        }),
      });
    }

    // 教师端标准积分端点
    return this.request('/api/v1/teacher/scores/give', {
      method: 'POST',
      body: JSON.stringify({
        student_id: params.studentId,
        score: params.score,
        reason: params.reason,
        rule_id: params.ruleId,
      }),
    });
  }

  /**
   * 获取全班学生宠物概览
   */
  async getPetsOverview(classId?: number | string): Promise<{
    pets: LearnStarPetInfo[];
    total_count: number;
  }> {
    const query = classId ? `?class_id=${classId}` : '';
    return this.request(`/api/v1/teacher/pets/overview${query}`);
  }

  /**
   * 批量导入学生花名册到学宠星球
   */
  async importStudents(classId: number | string, students: Array<{ name: string; student_no: string }>): Promise<any> {
    return this.request('/api/v1/teacher/students/import', {
      method: 'POST',
      body: JSON.stringify({
        class_id: classId,
        students,
      }),
    });
  }
}
