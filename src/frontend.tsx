import React, { useState, useEffect } from 'react';
import type { LearnStarConfig, ClassMapping, PetSpeciesMeta } from './contracts/index.js';
import { PET_SERIES, LEVEL_THRESHOLDS, STAGE_NAMES } from './pet-data.js';

export default function LearnStarPlanetPanel() {
  const [config, setConfig] = useState<LearnStarConfig>({
    baseUrl: 'http://localhost:8000',
    authMode: 'class_code',
    teacherUsername: '',
    teacherPassword: '',
    defaultClassCode: '',
    scoreExchangeRatio: 1.0,
    autoSyncAssignment: true,
    autoSyncAttendance: true,
  });

  const [mappings, setMappings] = useState<ClassMapping[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'classes' | 'pokedex' | 'logs'>('config');
  const [selectedSeries, setSelectedSeries] = useState<string>('myth');

  // 手动测试加分表单
  const [testScoreStudent, setTestScoreStudent] = useState('');
  const [testScoreValue, setTestScoreValue] = useState(10);
  const [testScoreReason, setTestScoreReason] = useState('课堂积极发言奖励');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/plugins/openlearn-plugin-learnstar/config').then(r => r.json());
      if (res?.config) setConfig(res.config);
      if (res?.mappings) setMappings(res.mappings);
      if (res?.logs) setLogs(res.logs);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: '读取学宠星球配置失败: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTestConnection = async () => {
    try {
      setStatusMsg(null);
      const res = await fetch('/api/plugins/openlearn-plugin-learnstar/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      }).then(r => r.json());

      if (res.success) {
        setStatusMsg({ type: 'success', text: res.message || '连接成功！学宠星球服务正常运行。' });
      } else {
        setStatusMsg({ type: 'error', text: res.message || '连接失败，请检查服务地址与网络。' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: '连接超时或错误: ' + err.message });
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/plugins/openlearn-plugin-learnstar/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      }).then(r => r.json());

      if (res.success) {
        setStatusMsg({ type: 'success', text: '学宠星球连接与积分联动规则保存成功！' });
        fetchData();
      } else {
        setStatusMsg({ type: 'error', text: res.error || '保存失败' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: '保存异常: ' + err.message });
    }
  };

  const handleManualGiveScore = async () => {
    if (!testScoreStudent) {
      alert('请输入学生 ID 或姓名');
      return;
    }
    try {
      const res = await fetch('/api/plugins/openlearn-plugin-learnstar/give-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: testScoreStudent,
          studentName: testScoreStudent,
          score: testScoreValue,
          reason: testScoreReason,
        }),
      }).then(r => r.json());

      if (res.success) {
        setStatusMsg({ type: 'success', text: `成功向学宠星球发送 +${testScoreValue} 积分！` });
        fetchData();
      } else {
        setStatusMsg({ type: 'error', text: '积分发放失败，请检查连接状态。' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: '发放失败: ' + err.message });
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>正在载入学宠星球互通配置...</div>;
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>
      {/* 头部标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.8rem' }}>🪐</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
              学宠星球 (LearnStar Planet) 互通枢纽
            </h2>
          </div>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0' }}>
            实现课堂行为积分双向联动、驱动 125 种学宠 12 级成长进化、大屏排行榜直达与名册对齐。
          </p>
        </div>
        {config.defaultClassCode && (
          <a
            href={`${config.baseUrl.replace(/\/$/, '')}/classroom`}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '0.5rem 1rem',
              background: '#4f46e5',
              color: '#fff',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span>🖥️ 打开教室大屏</span>
          </a>
        )}
      </div>

      {statusMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1.25rem',
            background: statusMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: statusMsg.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${statusMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          {statusMsg.text}
        </div>
      )}

      {/* 选项卡导航 */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #cbd5e1', marginBottom: '1.5rem' }}>
        {[
          { key: 'config', label: '⚙️ 互通连接与规则' },
          { key: 'classes', label: '🏫 班级与名册映射' },
          { key: 'pokedex', label: '📖 125种学宠图鉴与进化门槛' },
          { key: 'logs', label: '📜 实时同步流水' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            style={{
              padding: '0.6rem 1.2rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === t.key ? 600 : 400,
              color: activeTab === t.key ? '#2563eb' : '#64748b',
              borderBottom: activeTab === t.key ? '2px solid #2563eb' : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: 连接与规则配置 */}
      {activeTab === 'config' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginTop: 0, marginBottom: '1rem' }}>
              学宠星球服务连接参数
            </h3>
            <form onSubmit={handleSaveConfig}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.25rem' }}>
                  学宠星球服务基地址 (Base URL) *
                </label>
                <input
                  required
                  value={config.baseUrl}
                  onChange={e => setConfig({ ...config, baseUrl: e.target.value })}
                  placeholder="例如: http://localhost:8000 或 https://planet.school.edu"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.25rem' }}>
                  认证模式
                </label>
                <select
                  value={config.authMode}
                  onChange={e => setConfig({ ...config, authMode: e.target.value as any })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                >
                  <option value="class_code">班级码轻量模式 (仅需班级码，适合教室大屏快速加分)</option>
                  <option value="teacher">教师凭证高级模式 (全量名单导入、多班级管理与高级积分)</option>
                </select>
              </div>

              {config.authMode === 'teacher' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.25rem' }}>
                      学宠教师账号
                    </label>
                    <input
                      value={config.teacherUsername || ''}
                      onChange={e => setConfig({ ...config, teacherUsername: e.target.value })}
                      placeholder="教师端用户名"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.25rem' }}>
                      教师密码
                    </label>
                    <input
                      type="password"
                      value={config.teacherPassword || ''}
                      onChange={e => setConfig({ ...config, teacherPassword: e.target.value })}
                      placeholder="登录密码"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.25rem' }}>
                    默认班级码 (Class Display Code)
                  </label>
                  <input
                    value={config.defaultClassCode || ''}
                    onChange={e => setConfig({ ...config, defaultClassCode: e.target.value })}
                    placeholder="学宠星球分配给该教室的 6 位班级码"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </div>
              )}

              <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '1.25rem 0' }} />

              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.75rem' }}>
                🔄 课堂行为与成长联动规则
              </h4>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config.autoSyncAssignment}
                    onChange={e => setConfig({ ...config, autoSyncAssignment: e.target.checked })}
                  />
                  <span>作业批改完成自动加分 (将作业所得分值换算为学宠成长值)</span>
                </label>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config.autoSyncAttendance}
                    onChange={e => setConfig({ ...config, autoSyncAttendance: e.target.checked })}
                  />
                  <span>课堂到课签到奖励 (学生签到后自动发放 +5 积分助其宠物破壳成长)</span>
                </label>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.25rem' }}>
                  积分换算比例 (1 OpenLearn 积分 = N 点学宠成长值)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={config.scoreExchangeRatio || 1.0}
                  onChange={e => setConfig({ ...config, scoreExchangeRatio: parseFloat(e.target.value) || 1.0 })}
                  style={{ width: '120px', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="submit"
                  style={{ padding: '0.6rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                >
                  保存设置
                </button>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  style={{ padding: '0.6rem 1.25rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                >
                  测试连通性
                </button>
              </div>
            </form>
          </div>

          {/* 右侧：手动加分调试卡片 */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem', height: 'fit-content' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginTop: 0, marginBottom: '0.75rem' }}>
              🧪 实时积分触发测试
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
              手动模拟一次课堂激励加分，直接验证学宠星球接口是否正常触发宠物升级。
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#475569' }}>学生学号 / 姓名</label>
                <input
                  placeholder="例如: 202601 / 张小明"
                  value={testScoreStudent}
                  onChange={e => setTestScoreStudent(e.target.value)}
                  style={{ width: '100%', padding: '0.4rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#475569' }}>分值 (分)</label>
                <input
                  type="number"
                  value={testScoreValue}
                  onChange={e => setTestScoreValue(parseInt(e.target.value) || 0)}
                  style={{ width: '100%', padding: '0.4rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#475569' }}>激励原因</label>
                <input
                  value={testScoreReason}
                  onChange={e => setTestScoreReason(e.target.value)}
                  style={{ width: '100%', padding: '0.4rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.875rem' }}
                />
              </div>
              <button
                type="button"
                onClick={handleManualGiveScore}
                style={{
                  padding: '0.5rem',
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                }}
              >
                立即派发积分
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 班级映射与花名册 */}
      {activeTab === 'classes' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginTop: 0, marginBottom: '1rem' }}>
            班级绑定与花名册同步
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            建立 OpenLearn 班级与学宠星球班级的一一映射，支持通过学号自动对齐学生。
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '0.75rem 1rem' }}>OpenLearn 班级</th>
                <th style={{ padding: '0.75rem 1rem' }}>学宠星球班级 ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>班级大屏码</th>
                <th style={{ padding: '0.75rem 1rem' }}>上次同步</th>
              </tr>
            </thead>
            <tbody>
              {mappings.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    暂未绑定班级。OpenLearn 班级上课时将依据默认班级码派发成长积分。
                  </td>
                </tr>
              ) : (
                mappings.map(m => (
                  <tr key={m.openlearnClassId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{m.className || m.openlearnClassId}</td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>{m.learnstarClassId}</td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>{m.classCode || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                      {m.lastSyncedAt ? new Date(m.lastSyncedAt).toLocaleString() : '未同步'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: 学宠 125 种图鉴与 12 级进化门槛 */}
      {activeTab === 'pokedex' && (
        <div>
          {/* 进化门槛说明卡片 */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#166534', fontSize: '0.95rem' }}>
              ⭐ 学宠星球 12 级 6 阶段进化成长体系
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: '#166534' }}>
              <div>🐣 Lv 1~2: 元神之蛋 (0~15分)</div>
              <div>🍼 Lv 3~4: 幼灵初醒 (35~60分)</div>
              <div>🌱 Lv 5~6: 蓬勃成长 (90~125分)</div>
              <div>🦁 Lv 7~8: 大成归位 (165~210分)</div>
              <div>✨ Lv 9~10: 传说觉醒 (260~315分)</div>
              <div>👑 Lv 11~12: 超凡入圣 (375~450分)</div>
            </div>
          </div>

          {/* 系列切换 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {PET_SERIES.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSeries(s.id)}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: selectedSeries === s.id ? '#4f46e5' : '#cbd5e1',
                  background: selectedSeries === s.id ? '#eef2ff' : '#fff',
                  color: selectedSeries === s.id ? '#4338ca' : '#475569',
                  fontWeight: selectedSeries === s.id ? 600 : 400,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <span>{s.emoji}</span>
                <span>{s.name} ({s.species.length})</span>
              </button>
            ))}
          </div>

          {/* 选定系列的物种卡片 */}
          {PET_SERIES.filter(s => s.id === selectedSeries).map(series => (
            <div key={series.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {series.species.map(sp => (
                <div
                  key={sp.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '1rem',
                    textAlign: 'center',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{series.emoji}</div>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{sp.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{sp.id}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: 实时同步流水日志 */}
      {activeTab === 'logs' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginTop: 0, marginBottom: '1rem' }}>
            最近 15 次跨系统积分同步流水
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '0.6rem 0.75rem' }}>时间</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>事件类型</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>学生姓名</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>成长变动</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>原因</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>状态</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    暂无同步流水记录。当学生在 OpenLearn 中完成作业或课堂签到后，此处将展示同步日志。
                  </td>
                </tr>
              ) : (
                logs.map((l: any) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#64748b', fontSize: '0.75rem' }}>
                      {new Date(l.created_at).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>{l.event_type}</td>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 500 }}>{l.student_name}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#16a34a', fontWeight: 600 }}>+{l.score_delta}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#475569' }}>{l.reason}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.4rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          background: l.status === 'success' ? '#dcfce7' : '#fee2e2',
                          color: l.status === 'success' ? '#15803d' : '#b91c1c',
                        }}
                      >
                        {l.status === 'success' ? '成功' : '失败'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
