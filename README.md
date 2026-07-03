# TraceLight — Git Commit 日报/周报生成器

> 一款桌面端应用，自动拉取 Git 提交记录，智能生成日报与周报。

---

## 一、产品定位

| 维度 | 说明 |
|------|------|
| 目标用户 | 个人开发者、技术团队成员、项目经理 |
| 核心场景 | 每日下班前快速生成日报；每周五自动生成周报 |
| 价值主张 | 告别手动翻 Git log，一键生成结构化工作汇报 |
| 竞品差异 | 本地优先、数据不出本机、支持多仓库聚合、AI 智能总结 |

---

## 二、功能架构

```
TraceLight
├── 配置中心
│   ├── Git 仓库管理（添加/删除/编辑仓库）
│   ├── Git 账号管理（用户名、Token / SSH Key）
│   ├── 工作时间设置（上班时间、下班时间、时区）
│   └── 通知偏好（日报/周报提醒时间）
│
├── 提交记录
│   ├── 多仓库提交列表（按时间线聚合）
│   ├── 按日期/仓库/分支筛选
│   ├── 提交详情查看（文件变更、Diff 预览）
│   └── 手动编辑/补充提交说明
│
├── 日报生成
│   ├── 按当日提交自动汇总
│   ├── AI 智能总结（自然语言描述工作内容）
│   ├── 多模板切换（技术向 / 简洁向 / 详细向）
│   ├── 手动编辑与润色
│   └── 一键复制 / 导出 Markdown / 导出 PDF
│
├── 周报生成
│   ├── 按本周提交自动汇总
│   ├── 按项目/模块/类型分类整理
│   ├── AI 生成周度总结与下周计划
│   ├── 可视化统计（提交趋势、文件变更热力图）
│   └── 一键复制 / 导出 Markdown / 导出 PDF
│
└── 数据统计
    ├── 提交频率趋势图
    ├── 代码增删量统计
    ├── 活跃仓库排行
    └── 工作时段分布
```

---

## 三、页面设计

### 3.1 整体风格

- **主题**：深色 / 浅色双模式，默认跟随系统
- **色调**：主色 `#4F46E5`（Indigo），辅助色 `#10B981`（Green）
- **字体**：中文用 PingFang SC / 思源黑体，英文用 Inter / JetBrains Mono
- **布局**：左侧导航栏 + 右侧内容区，最大宽度 1200px 居中
- **间距**：遵循 8px 网格系统，圆角 8-12px

### 3.2 页面清单

| 页面 | 路由 | 说明 |
|------|------|------|
| 仪表盘 | `/dashboard` | 今日概览、快速入口、最近提交 |
| 仓库管理 | `/repos` | 添加/编辑/删除 Git 仓库 |
| 提交记录 | `/commits` | 多仓库提交列表，支持筛选 |
| 日报 | `/daily` | 生成/编辑/导出日报 |
| 周报 | `/weekly` | 生成/编辑/导出周报 |
| 统计 | `/stats` | 可视化数据面板 |
| 设置 | `/settings` | 账号、时间、通知、外观 |

### 3.3 关键页面线框

#### 仪表盘（Dashboard）

```
┌─────────────────────────────────────────────────┐
│  TraceLight          [深色/浅色]    [设置] [退出] │
├──────┬──────────────────────────────────────────┤
│      │                                          │
│ 仪表盘│  👋 你好，张三                            │
│      │  今日已提交 12 次，生成日报 →              │
│ 提交  │                                          │
│ 日报  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ 周报  │  │ 今日提交  │ │ 本周提交  │ │ 活跃仓库  │ │
│ 统计  │  │    12    │ │    67    │ │     5    │ │
│      │  └──────────┘ └──────────┘ └──────────┘ │
│ 设置  │                                          │
│      │  ── 最近提交 ──────────────────────────  │
│      │  feat: 新增用户登录模块     14:32  main   │
│      │  fix: 修复分页查询Bug       11:20  dev    │
│      │  refactor: 重构缓存逻辑     09:45  main   │
│      │  ...                                     │
└──────┴──────────────────────────────────────────┘
```

#### 日报页面

```
┌─────────────────────────────────────────────────┐
│  日报  [2024-01-15]  [← 前一天]  [后一天 →]     │
├─────────────────────────────────────────────────┤
│                                                 │
│  📝 今日提交摘要（来自 3 个仓库）                  │
│  ┌─────────────────────────────────────────────┐│
│  │ ☑ TraceLight  6 commits                     ││
│  │ ☑ Backend     4 commits                     ││
│  │ ☐ Frontend    2 commits                     ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  🤖 AI 生成总结                    [重新生成]     │
│  ┌─────────────────────────────────────────────┐│
│  │ 今日主要工作：                                ││
│  │ 1. 完成用户登录模块的开发，包括 Token 刷新    ││
│  │    机制和密码加密存储                         ││
│  │ 2. 修复分页查询在大数据量下的性能问题          ││
│  │ 3. 重构缓存层逻辑，引入 LRU 淘汰策略          ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  [手动编辑]  [切换模板]  [复制]  [导出PDF]        │
│                                                 │
│  📋 提交明细                                     │
│  ┌─────────────────────────────────────────────┐│
│  │ 14:32 feat: add user login module            ││
│  │ 14:30 feat: add token refresh logic          ││
│  │ 11:20 fix: resolve pagination query bug      ││
│  │ 09:45 refactor: rewrite cache layer          ││
│  │ ...                                         ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

---

## 四、技术方案

### 4.1 技术选型

| 层级 | 技术 | 理由 |
|------|------|------|
| 框架 | **Electron + React + TypeScript** | 跨平台桌面，生态成熟 |
| UI 组件 | **Ant Design 5.x** | 开箱即用，风格契合 |
| 状态管理 | **Zustand** | 轻量，TypeScript 友好 |
| 数据库 | **SQLite（via better-sqlite3）** | 本地存储提交记录、配置 |
| Git 操作 | **isomorphic-git** | 纯 JS 实现，不依赖系统 git |
| AI 总结 | **OpenAI API / 本地 Ollama** | 可选云端或本地模型 |
| 打包 | **electron-builder** | 成熟的打包与自动更新方案 |
| PDF 导出 | **@react-pdf/renderer** | React 组件直接渲染 PDF |

### 4.2 数据模型

```sql
-- 仓库配置
CREATE TABLE repos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  remote_url TEXT NOT NULL,
  local_path TEXT NOT NULL,
  branch     TEXT DEFAULT 'main',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Git 账号
CREATE TABLE accounts (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  token    TEXT,          -- GitHub PAT，加密存储
  ssh_key  TEXT,          -- SSH 私钥路径
  type     TEXT DEFAULT 'github'  -- github / gitlab / gitee
);

-- 提交记录（缓存）
CREATE TABLE commits (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id    INTEGER REFERENCES repos(id),
  hash       TEXT NOT NULL UNIQUE,
  message    TEXT NOT NULL,
  author     TEXT NOT NULL,
  date       DATETIME NOT NULL,
  additions  INTEGER DEFAULT 0,
  deletions  INTEGER DEFAULT 0,
  files_changed INTEGER DEFAULT 0
);

-- 日报/周报
CREATE TABLE reports (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  type       TEXT NOT NULL,  -- 'daily' | 'weekly'
  date       DATE NOT NULL,
  content    TEXT NOT NULL,  -- Markdown 格式
  ai_summary TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 五、Git 集成方案

### 5.1 支持的认证方式

| 方式 | 适用场景 | 实现 |
|------|---------|------|
| Personal Access Token | GitHub / GitLab / Gitee | HTTPS + Token 认证 |
| SSH Key | 自建 Git 服务器 | 指定本地 SSH 私钥路径 |
| 凭证管理器 | 系统已配置 git 的场景 | 直接读取系统凭证 |

### 5.2 同步策略

```
启动时自动同步 → 增量拉取最近 7 天提交
手动同步      → 全量拉取指定时间范围
定时同步      → 可配置间隔（默认 30 分钟）
```

---

## 六、AI 总结能力

### 6.1 输入

- 指定时间范围内的 commit messages
- 文件变更统计（增/删/改）
- 变更文件路径（推断模块归属）

### 6.2 输出

- **日报**：3-5 条结构化工作要点
- **周报**：按模块/功能分类的工作总结 + 下周计划建议

### 6.3 Prompt 设计思路

```
你是一名技术团队成员，请根据以下 Git 提交记录生成{日报/周报}。

要求：
1. 按功能模块分类整理，不要逐条罗列
2. 使用专业的技术语言，简洁明了
3. 突出完成的功能和解决的问题
4. 如果是周报，附加下周计划建议

提交记录：
{commits}

变更统计：
{stats}
```

---

## 七、非功能性需求

| 维度 | 要求 |
|------|------|
| 性能 | 首屏加载 < 2s，提交列表万级数据流畅滚动 |
| 安全 | Token/密钥加密存储，不明文落盘 |
| 离线 | 核心功能（查看提交、编辑报告）离线可用 |
| 更新 | 支持自动检查更新，静默下载 |
| 国际化 | 中/英文双语，可扩展 |
| 数据导出 | Markdown / PDF / HTML 三种格式 |

---

## 八、开发里程碑

| 阶段 | 内容 | 周期 |
|------|------|------|
| P0 - MVP | 仓库配置 + 提交拉取 + 日报生成 | 2 周 |
| P1 - 核心 | 周报生成 + 多仓库聚合 + 统计面板 | 2 周 |
| P2 - 体验 | AI 总结 + 模板系统 + PDF 导出 + 深色模式 | 2 周 |
| P3 - 打磨 | 自动更新 + 国际化 + 性能优化 | 1 周 |

---

## 九、项目结构

```
TraceLight/
├── electron/                  # Electron 主进程
│   ├── main.ts
│   ├── preload.ts
│   └── ipc/                   # IPC 通信处理
│       ├── git.ts
│       ├── db.ts
│       └── ai.ts
├── src/                       # React 渲染进程
│   ├── components/            # 通用组件
│   ├── pages/                 # 页面组件
│   │   ├── Dashboard/
│   │   ├── Repos/
│   │   ├── Commits/
│   │   ├── Daily/
│   │   ├── Weekly/
│   │   ├── Stats/
│   │   └── Settings/
│   ├── stores/                # Zustand 状态
│   ├── services/              # 业务逻辑
│   ├── hooks/                 # 自定义 Hooks
│   ├── styles/                # 全局样式
│   └── utils/                 # 工具函数
├── prisma/                    # 数据库 Schema
├── scripts/                   # 构建脚本
├── package.json
├── tsconfig.json
└── README.md
```

---

## 十、后续扩展方向

- **团队模式**：聚合团队成员提交，生成团队周报
- **飞书/钉钉集成**：一键推送到企业 IM
- **Jira/Linear 联动**：提交自动关联任务卡片
- **代码评审摘要**：集成 PR/MR 信息
- **自定义 Prompt**：用户可编辑 AI 总结的提示词
