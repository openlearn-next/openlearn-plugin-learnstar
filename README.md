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
- **现代化可视化管理控制台**：内置直观的管理 UI，支持服务连通性探针、换算比例调控、班级映射绑定、实时同步流水日志与大屏一键直达。

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
│   ├── frontend.tsx          # 前端管理控制台 (连接配置、大屏直达、图鉴卡片、日志流水)
│   └── index.ts              # 后端服务入口 (事件监听与 HTTP API 路由)
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

## 📄 License

MIT © OpenLearn Team
