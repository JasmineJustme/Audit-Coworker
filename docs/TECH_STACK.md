# TECH_STACK.md — Audit Coworker 技术栈锁定

> 所有依赖包锁定到精确版本，禁止 AI 或开发者自行选择替代方案。
> 版本确认日期：2026-03-02

---

## 1. 运行环境

| 环境   | 版本       | 说明               |
| ---- | -------- | ---------------- |
| Node.js | >= 20.11.0 LTS | 前端构建与开发服务器 |
| Python | >= 3.12.0 | 后端运行时 |
| npm | >= 10.2.0 | 前端包管理 |
| pip | >= 24.0 | 后端包管理 |
| SQLite | >= 3.45.0 | V1 数据库（Python 内置） |

---

## 2. 前端依赖

### 2.1 核心框架

| 包名 | 版本 | 用途 |
| --- | --- | --- |
| react | 19.2.4 | UI 框架 |
| react-dom | 19.2.4 | React DOM 渲染 |
| typescript | 5.9.3 | 类型安全（最新稳定版，不用 6.0 beta） |
| vite | 7.3.1 | 构建工具与开发服务器 |
| @vitejs/plugin-react | 4.4.1 | Vite React 插件 |

### 2.2 UI 框架与组件

| 包名 | 版本 | 用途 |
| --- | --- | --- |
| antd | 6.3.1 | UI 组件库（按钮、表格、表单、弹窗等） |
| @ant-design/icons | 6.0.0 | Ant Design 图标库 |
| @ant-design/cssinjs | 1.22.1 | Ant Design CSS-in-JS 引擎 |

### 2.3 路由与状态管理

| 包名 | 版本 | 用途 |
| --- | --- | --- |
| react-router-dom | 7.13.1 | 前端路由（SPA 导航） |
| zustand | 5.0.11 | 全局状态管理（轻量） |

### 2.4 数据请求与工具

| 包名 | 版本 | 用途 |
| --- | --- | --- |
| axios | 1.9.0 | HTTP 请求客户端（调用后端 API） |
| dayjs | 1.11.13 | 日期时间处理（替代 moment.js） |

### 2.5 图表与可视化

| 包名 | 版本 | 用途 |
| --- | --- | --- |
| echarts | 6.0.0 | 图表引擎（Dashboard 图表、数据分析图表、LLM 用量趋势图） |
| echarts-for-react | 3.0.6 | ECharts React 封装组件 |
| dhtmlx-gantt | 9.1.2 | 甘特图（调度监控面板的时间线视图） |

### 2.6 SSE 客户端

| 包名 | 版本 | 用途 |
| --- | --- | --- |
| eventsource-parser | 3.0.1 | SSE 流式解析（实时状态推送） |

### 2.7 文件处理

| 包名 | 版本 | 用途 |
| --- | --- | --- |
| xlsx | 0.18.5 | Excel 文件解析（待办任务批量导入） |
| file-saver | 2.0.5 | 前端文件下载（执行历史导出、配置导出） |

### 2.8 开发工具（devDependencies）

| 包名 | 版本 | 用途 |
| --- | --- | --- |
| eslint | 9.21.0 | 代码检查 |
| @typescript-eslint/eslint-plugin | 8.26.0 | TypeScript ESLint 规则 |
| @typescript-eslint/parser | 8.26.0 | TypeScript ESLint 解析器 |
| prettier | 3.5.3 | 代码格式化 |
| @types/react | 19.2.0 | React 类型定义 |
| @types/react-dom | 19.2.0 | React DOM 类型定义 |
| @types/file-saver | 2.0.7 | file-saver 类型定义 |

---

## 3. 后端依赖

### 3.1 核心框架

| 包名 | 版本 | 用途 |
| --- | --- | --- |
| fastapi | 0.135.1 | Web 框架（REST API + 内置 SSE 支持） |
| uvicorn[standard] | 0.41.0 | ASGI 服务器 |
| pydantic | 2.10.6 | 数据校验与序列化 |
| pydantic-settings | 2.7.1 | 配置管理（环境变量 / .env） |

### 3.2 数据库与 ORM

| 包名 | 版本 | 用途 |
| --- | --- | --- |
| sqlalchemy | 2.0.48 | ORM（数据模型定义、查询） |
| aiosqlite | 0.20.0 | SQLite 异步驱动（配合 SQLAlchemy async） |
| alembic | 1.14.1 | 数据库迁移工具 |

### 3.3 HTTP 客户端（Dify API 调用）

| 包名 | 版本 | 用途 |
| --- | --- | --- |
| httpx | 0.28.1 | 异步 HTTP 客户端（调用 Dify REST API） |

### 3.4 定时任务

| 包名 | 版本 | 用途 |
| --- | --- | --- |
| apscheduler | 3.11.2 | 定时任务调度（数据源同步、循环任务触发） |

### 3.5 SSE 服务端

| 包名 | 版本 | 用途 |
| --- | --- | --- |
| sse-starlette | 2.2.1 | FastAPI SSE 支持（实时推送事件到前端） |

### 3.6 日志

| 包名 | 版本 | 用途 |
| --- | --- | --- |
| loguru | 0.7.3 | 结构化日志（替代 Python 原生 logging） |

### 3.7 工具库

| 包名 | 版本 | 用途 |
| --- | --- | --- |
| python-multipart | 0.0.20 | 文件上传支持（Excel 导入） |
| python-dotenv | 1.0.1 | .env 环境变量加载 |
| orjson | 3.10.15 | 高性能 JSON 序列化 |

### 3.8 测试（dev 依赖）

| 包名 | 版本 | 用途 |
| --- | --- | --- |
| pytest | 8.3.4 | 测试框架 |
| pytest-asyncio | 0.24.0 | 异步测试支持 |
| httpx | 0.28.1 | 测试中用作 TestClient |

---

## 4. 外部服务

| 服务 | 集成方式 | 说明 |
| --- | --- | --- |
| Dify 平台（私有化部署） | REST API（阻塞模式） | Agent 和 Workflow 调用、数据源同步、外部推送 |
| LLM 提供商（多选） | REST API | 支持 OpenAI / Azure OpenAI / DeepSeek / Qwen / 通过 Dify 等 |

---

## 5. 项目脚手架命令

```bash
# 前端初始化
npm create vite@7.3.1 frontend -- --template react-ts

# 后端初始化
mkdir backend && cd backend
python -m venv .venv
pip install fastapi==0.135.1 uvicorn[standard]==0.41.0
```

---

## 6. 不使用的技术（明确排除）

| 排除项 | 原因 |
| --- | --- |
| Next.js | 本项目为 SPA，无需 SSR |
| Redux / MobX | Zustand 更轻量，足以满足需求 |
| Tailwind CSS | 使用 CSS Modules + Ant Design 主题，避免样式冲突 |
| MongoDB / Redis | V1 使用 SQLite + 数据库队列，保持简单 |
| Celery | V1 使用 APScheduler + DB 队列，后续版本再升级 |
| WebSocket | 使用 SSE（单向推送已满足需求，实现更简单） |
| moment.js | 已废弃，使用 dayjs |
