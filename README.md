# OpenLearn LearnStar Planet Connector Plugin (学宠星球互通插件)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: OpenLearn](https://img.shields.io/badge/OpenLearn-v0.3.15%2B-brightgreen.svg)](https://github.com/aymwoo/OpenLearn-Next-V2)
[![Upstream: RealKiro/learnstar-planet](https://img.shields.io/badge/LearnStar-Planet-indigo.svg)](https://github.com/RealKiro/learnstar-planet)

本插件为 **OpenLearn V2 (openlearn-next)** 提供与数字化班级习惯养成系统 **[学宠星球 (LearnStar Planet)](https://github.com/RealKiro/learnstar-planet)** 的官方双向互通能力。通过本插件，OpenLearn 课堂中的作业成绩、出勤考勤与白板互动行为将自动转化为学宠成长积分，实时驱动学生对应的 125 种学宠进行 12 级 6 阶段形态进化，并支持在教学大屏与白板中快捷直达学宠星球教室端 (`/classroom`)。

---

## 🌟 核心互通特性

- **课堂积分驱动 12 级宠物进化**：监听 OpenLearn 内核事件（`assignment.graded`、`attendance.recorded`），自动按可配比例向学宠星球派发成长积分，驱动宠物从“幼灵初醒”向“传说觉醒”、“超凡入圣”逐级进化！
- **双认证互通模式**：
  - **班级码轻量模式**：仅需填入学宠星球 6 位班级码即可无感对接，适合各班级大屏快速联动；
  - **教师凭据高级模式**：通过 Sanctum 令牌拉取名下全部班级并批量导入同步学生花名册。
- **10 大系列 125 种宠物图鉴内置**：完整集成山海经、宝可梦、华夏国宝、数码宝贝、魔法奇幻、史前生物、圣斗士星座守护、传统节日、虹猫蓝兔七侠传与东方神话的物种元数据与阶位计算器。
- **管理 API 完备**：`/config`（读写连接配置与换算比例）、`/test-connection`（连通性探针）、`/classes` 与 `/sync-roster`（班级映射与名册对齐）、`/pets-overview`（学宠概览）、`/pet-species`（125 种图鉴）。
  > ⚠️ 原「现代化可视化管理控制台」（`src/frontend.tsx` 的 React 面板）已移除 —— 它导出的是一个 React 组件、没有 `activate`，在当前插件契约下**永远加载不起来**（详见文末「关于前端面板」）。配置改走上面的管理 API。

---

## 📂 项目结构

```
openlearn-plugin-learnstar/
├── package.json              # 依赖 @openlearn/plugin-sdk@3.6.1
├── manifest.json             # 插件规格清单 (声明权限、API 静态路由与元数据)
├── tsconfig.json             # TypeScript 构建配置
├── build.mjs                 # 自动化 esbuild 打包与 ZIP 生成流水线
├── src/
│   ├── contracts/index.ts    # 跨端数据契约 (Config, Mappings, StudentPet)
│   ├── client.ts             # 学宠星球 REST API 客户端 (Sanctum/班级码)
│   ├── pet-data.ts           # 10 大系列 125 种物种与 12 级进化计算器
│   ├── sync-service.ts       # 核心同步引擎 (SQLite 映射持久化与事件监听换算)
│   └── index.ts              # 后端服务入口 (注册 /config, /sync-roster, /pets-overview 等端点)
├── docs/
│   └── integration-guide.md  # 详细对接与排错指南
├── test/
│   └── verify.mjs            # 自动化成长阶梯与物种唯一性验证单测
└── README.md                 # 插件说明手册
```

---

## 🚀 快速上手与构建打包

### 1. 安装依赖

```bash
pnpm install
```

### 2. 运行单测

```bash
pnpm test
```

### 3. 编译打包

```bash
pnpm run build
```

构建完成后将在根目录生成 **`openlearn-plugin-learnstar.zip`**，可直接上传至 OpenLearn 插件中心启用！

---

## 📄 关联文档

- 📖 [学宠星球系统对接与配置向导](docs/integration-guide.md)
- 🪐 [学宠星球官方仓库 (RealKiro/learnstar-planet)](https://github.com/RealKiro/learnstar-planet)

---

## 关于前端面板（为什么删掉了 `src/frontend.tsx`）

原 `frontend.tsx` 是一个 React 组件，`export default function LearnStarPlanetPanel()`。它**不符合当前插件前端契约**，且无法通过「改一改」修好：

1. **宿主加载器的硬判据是 `typeof plugin.activate === 'function'`**（`server/utils/plugin-sandbox-frame.ts`），
   default export 是组件就直接抛 `missing activate function`，插件进错误态 —— 连带后端也被标成不可用。
2. 就算补一个 `activate`，插件前端仍然跑不进去：它运行在 `sandbox="allow-scripts"` 的**不透明源 iframe** 里，
   那里没有 React、没有 `window.HostSharedDeps`、没有 importmap；加载方式是 `Blob` + 动态 `import()`，
   `import React from 'react'` / `react/jsx-runtime` 这样的裸说明符无从解析（已实测产物里两者都残留）。
3. 想做成可见 UI，只能用 manifest 的**声明式贡献**（由宿主渲染），而任意面板界面表达不了。

该文件里也没有任何挂载代码（无 `createRoot` / `registerExtensionPoint`），组件树从未被渲染过，属于死代码。删掉之后，插件可正常激活，业务能力全部通过后端 API 提供：`/config`、`/test-connection`、`/classes`、`/sync-roster`、`/give-score`、`/pets-overview`、`/pet-species`。若后续平台支持「远程插件可见 UI」，把 `frontend.tsx`（按 `export default { activate, deactivate }` 契约）加回来即可 —— `build.mjs` 里保留了 `if (existsSync(frontendEntry))` 分支。

---

## 📄 License

MIT © OpenLearn Team
