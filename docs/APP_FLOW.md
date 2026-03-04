# APP_FLOW.md — Audit Coworker 应用流程与导航

> 记录每个页面、每条用户导航路径、每个决策点、成功/错误处理。
> AI 编码时必须严格遵循此文档，不得猜测用户如何在应用中移动。

---

## 1. 全局布局结构

```
+-------------------------------------------------------+
|  顶部栏（Logo + 全局搜索栏 + 通知角标 + 用户头像）       |
+----------+--------------------------------------------+
|          |                                            |
|  左侧    |            主内容区                          |
|  导航栏   |           （路由渲染区）                      |
|  (可折叠) |                                            |
|          |                                            |
+----------+--------------------------------------------+
```

### 1.1 左侧导航菜单分组

```
📊 工作台
  ├── Dashboard 总览          /dashboard
  └── 待办任务                /todos

🤖 智能处理
  ├── 智能编排                /orchestration
  ├── 调度监控                /scheduling
  └── 执行历史                /history

⚙️ 配置中心
  ├── Agent 管理             /config/agents
  ├── Workflow 管理          /config/workflows
  ├── W-Agent 管理           /config/wagents
  ├── 数据源配置             /config/datasources
  ├── 大模型配置             /config/llm
  ├── 提醒渠道配置           /config/notifications
  └── 配置导入/导出          /config/import-export

🔔 消息中心                  /messages

🛠️ 系统
  ├── 系统设置               /settings
  ├── 操作审计日志            /audit-logs
  └── 提醒偏好设置            /settings/notification-prefs
```

### 1.2 路由清单

| 路由路径 | 页面名称 | 组件文件 |
| --- | --- | --- |
| `/` | 根路由，重定向到 `/dashboard` 或 `/setup`（首次） | — |
| `/setup` | 引导式初始化 Setup Wizard | `pages/Setup/` |
| `/dashboard` | Dashboard 总览页 | `pages/Dashboard/` |
| `/todos` | 待办任务列表 | `pages/Todos/` |
| `/todos/review` | 智能梳理结果确认页 | `pages/Todos/Review/` |
| `/orchestration` | 智能编排确认页 | `pages/Orchestration/` |
| `/scheduling` | 调度监控面板 | `pages/Scheduling/` |
| `/history` | 执行历史页 | `pages/History/` |
| `/history/analytics` | 数据分析页 | `pages/History/Analytics/` |
| `/config/agents` | Agent 配置列表 | `pages/Config/Agents/` |
| `/config/agents/:id` | Agent 配置详情/编辑 | `pages/Config/Agents/Detail/` |
| `/config/workflows` | Workflow 配置列表 | `pages/Config/Workflows/` |
| `/config/workflows/:id` | Workflow 配置详情/编辑 | `pages/Config/Workflows/Detail/` |
| `/config/wagents` | W-Agent 配置列表 | `pages/Config/WAgents/` |
| `/config/wagents/new` | W-Agent 新建 | `pages/Config/WAgents/Editor/` |
| `/config/wagents/:id` | W-Agent 编辑 | `pages/Config/WAgents/Editor/` |
| `/config/wagents/:id/versions` | W-Agent 版本历史 | `pages/Config/WAgents/Versions/` |
| `/config/datasources` | 数据源配置页 | `pages/Config/DataSources/` |
| `/config/llm` | 大模型配置页 | `pages/Config/LLM/` |
| `/config/notifications` | 提醒渠道配置页 | `pages/Config/Notifications/` |
| `/config/import-export` | 配置导入/导出页 | `pages/Config/ImportExport/` |
| `/messages` | 消息中心 | `pages/Messages/` |
| `/settings` | 系统设置 | `pages/Settings/` |
| `/settings/notification-prefs` | 提醒偏好设置 | `pages/Settings/NotificationPrefs/` |
| `/audit-logs` | 操作审计日志 | `pages/AuditLogs/` |

---

## 2. 首次使用流程（Setup Wizard）

### 触发条件
用户首次打开系统，后端检测到数据库中无任何 LLM 配置、Agent 配置、数据源配置。

### 流程

```
用户打开系统
  │
  ├── 后端 GET /api/system/init-status 返回 { initialized: false }
  │   └── 前端重定向到 /setup
  │
  └── 后端返回 { initialized: true }
      └── 前端重定向到 /dashboard
```

**Setup Wizard 步骤：**

1. **欢迎页** → 介绍系统功能，点击「开始配置」
2. **步骤 1：大模型配置**
   - 选择提供商（OpenAI / Azure / DeepSeek / Qwen / Dify 等）
   - 填写 API 端点、API Key
   - 选择模型名称、设置参数
   - 至少完成「待办梳理 LLM」的配置
   - 点击「测试连接」→ 成功则继续，失败则显示错误提示
3. **步骤 2：数据源配置**
   - 配置至少 1 个数据源 Agent（邮件 / 日程 / 项目进展）
   - 填写 Dify API 端点、API Key、输入输出参数
   - 点击「测试连接」验证
4. **步骤 3：Agent / Workflow 配置**
   - 录入至少 1 个 Agent 或 Workflow
   - 填写基础信息和输入输出参数
5. **步骤 4：提醒渠道配置**
   - 配置至少 1 个外部推送渠道 Workflow（邮件 / 企微）
   - 可跳过此步骤
6. **完成页** → 显示配置摘要 → 点击「进入系统」→ 跳转 `/dashboard` 并立即触发首次数据源同步

**每一步均可点击「跳过」按钮，跳过后系统标记为已初始化但配置不完整，Dashboard 上显示配置提醒卡片。**

### 错误处理
- API 连接测试失败：显示红色错误提示，不阻塞下一步，但警告「该配置未验证通过」
- 网络错误：显示 Toast「网络连接失败，请检查」

---

## 3. Dashboard 总览流程

### 路由：`/dashboard`

### 进入条件
系统已初始化（`initialized: true`）

### 页面加载序列
1. 并行请求：
   - `GET /api/dashboard/stats` → 关键指标（今日待办数、待确认数、执行中数、完成数、失败数）
   - `GET /api/dashboard/next-task` → 下一个即将执行的任务
   - `GET /api/dashboard/trend` → 近 7 天完成趋势数据
   - `GET /api/dashboard/agent-ranking` → Agent 调用频次排行
   - `GET /api/dashboard/sync-status` → 数据源同步状态
2. 渲染指标卡片、图表、快捷入口
3. SSE 连接建立后，实时更新指标

### 用户操作
| 操作 | 触发 | 结果 |
| --- | --- | --- |
| 点击「待确认事项」卡片 | 跳转 | → `/todos/review` 或 `/orchestration`（取决于待确认类型） |
| 点击「失败任务」卡片 | 跳转 | → `/scheduling?status=failed` |
| 点击「下一个任务」倒计时区 | 跳转 | → `/scheduling?task={taskId}` |
| 点击最近使用 Agent 快捷入口 | 跳转 | → `/orchestration?agent={agentId}` |
| 配置不完整提醒卡片 | 跳转 | → 对应配置页面 |

### 错误处理
- 任一 API 失败：对应区块显示「加载失败，点击重试」
- SSE 断开：自动重连（指数退避），顶部显示「连接中...」状态条

---

## 4. 待办任务流程

### 4.1 待办任务列表（`/todos`）

#### 页面加载
`GET /api/todos?status=pending&page=1&size=20` → 获取待办列表

#### 视图切换
- 列表视图（默认）：表格展示，支持列排序
- 看板视图：按状态分列（待确认 | 待处理 | 处理中 | 已完成）

#### 用户操作流程

**手动创建待办：**
```
点击「新建待办」按钮
  → 弹出抽屉表单（标题、描述、优先级、截止时间、关联项目、标签）
  → 填写完成 → 点击「保存」
  → POST /api/todos → 成功：Toast "创建成功"，列表刷新
                     → 失败：表单显示错误信息
  → 可选：勾选「提交到智能编排」复选框
    → 若勾选：创建后自动 POST /api/orchestration/submit { todoId }
    → 跳转到 /orchestration?todoId={id}
```

**批量导入：**
```
点击「批量导入」按钮
  → 弹窗选择 Excel 文件（.xlsx）
  → 前端用 xlsx 库解析文件 → 预览数据表格
  → 用户确认 → POST /api/todos/batch-import
  → 成功：Toast "导入 N 条待办"，列表刷新
  → 失败：显示错误行号和原因
```

**提交到智能编排：**
```
选中一条或多条待办 → 点击「提交到智能编排」
  → POST /api/orchestration/submit { todoIds: [...] }
  → 跳转到 /orchestration
  → LLM 开始分析（显示加载动画）
```

**筛选/排序：**
- 顶部筛选栏：状态、优先级、来源、标签、截止时间范围
- 排序：按截止时间、优先级、创建时间

#### 错误处理
- 列表加载失败：显示空状态 + 重试按钮
- 删除确认：二次确认弹窗「确定要删除此待办吗？」

---

### 4.2 智能梳理确认页（`/todos/review`）

#### 触发条件
- 数据源同步完成后 LLM 梳理出新待办
- 用户点击消息通知中的「确认梳理结果」
- Dashboard 点击「待确认」入口

#### 页面加载
`GET /api/todos/review-pending` → 获取待确认梳理结果列表

#### 展示内容
每条梳理结果显示：
- 来源标识图标（邮件📧 / 日程📅 / 项目进展📊）
- 任务描述
- LLM 建议优先级（可下拉修改）
- LLM 建议截止时间（可日期选择器修改）
- 推荐理由（折叠区域，点击「查看理由」展开）
- 去重标识（若 LLM 检测到与已有任务疑似重复，标黄提醒）

#### 用户操作

```
逐条操作：
  ├── 点击「确认」→ PATCH /api/todos/review/{id}/confirm
  ├── 点击「修改后确认」→ 展开编辑区 → 修改字段 → 点击「确认」
  └── 点击「拒绝」→ PATCH /api/todos/review/{id}/reject

批量操作：
  ├── 勾选多条 → 点击「批量确认」→ POST /api/todos/review/batch-confirm
  └── 勾选多条 → 点击「批量拒绝」→ POST /api/todos/review/batch-reject

全部操作完成后：
  → 页面显示「所有梳理结果已处理」
  → 提供「返回待办列表」和「提交已确认任务到智能编排」两个按钮
```

#### 错误处理
- 确认失败：Toast 报错，不移除该条目
- 若无待确认项：显示空状态「暂无待确认的梳理结果」

---

## 5. 智能编排流程

### 路由：`/orchestration`

### 触发条件
- 用户从待办列表提交任务到编排
- 数据源同步后系统自动编排（结果等待确认）
- 用户从消息通知进入

### 流程序列

```
进入页面
  │
  ├── 有正在分析中的编排任务
  │   └── 显示加载动画「LLM 正在分析任务...」
  │       └── SSE 推送分析完成事件 → 渲染编排方案
  │
  └── 有待确认的编排方案
      └── 渲染编排方案详情

编排方案展示内容：
  ├── 任务概要（来源任务描述）
  ├── LLM 推荐的 Agent/W-Agent（附推荐理由，默认折叠）
  ├── 自动填充的输入参数（可编辑）
  ├── 时间排期（开始时间、预计耗时、截止时间）
  ├── 任务依赖关系图（DAG 可视化）
  └── 优先级（LLM 建议，可修改）

用户决策：
  │
  ├── 点击「确认执行」
  │   → POST /api/orchestration/{id}/confirm
  │   → 成功：Toast「已加入调度队列」→ 可跳转到 /scheduling
  │
  ├── 点击「修改 Agent」→ 弹出 Agent/W-Agent 选择器
  │   → 选择后 LLM 自动重新填充输入参数
  │   → 返回编排方案页面继续确认
  │
  ├── 点击「修改参数」→ 展开参数编辑表单
  │   → 修改后点击「确认执行」
  │
  └── 点击「取消」→ 任务返回待办列表

若为 Workflow 编排（无匹配 Agent 时）：
  ├── 展示 Workflow 编排步骤列表
  ├── 每步显示：Workflow 名称、输入输出映射、执行顺序
  ├── LLM 自动生成 W-Agent 名称（可编辑）
  │
  ├── 点击「确认编排」
  │   → POST /api/orchestration/{id}/confirm-wagent
  │   → 自动保存为 W-Agent + 加入调度队列
  │
  └── 点击「修改编排」→ 可调整步骤顺序、参数映射

若 LLM 无法处理：
  └── 显示「无法自动处理此任务」卡片
      ├── 展示 LLM 给出的建议
      └── 按钮「返回待办列表」
```

### 错误处理
- LLM 分析超时：显示「分析超时，请重试」+ 重试按钮
- LLM 返回异常：显示「分析失败」+ 错误详情 + 重试按钮

---

## 6. 调度监控流程

### 路由：`/scheduling`

### 页面加载
`GET /api/scheduling/tasks?page=1&size=50` → 获取调度任务列表

### 视图切换
- **甘特图视图**（默认）：横向时间轴 + 任务条，V1 仅展示不可拖拽
- **列表视图**：表格展示所有调度任务

### 任务状态颜色
- 待执行（灰色）→ 待确认（蓝色）→ 执行中（橙色闪烁）→ 已完成（绿色）/ 失败（红色）/ 已跳过（浅灰）/ 已阻塞（紫色）/ 已暂停（黄色）

### 执行前确认弹窗（全局弹窗组件）

```
调度引擎触发任务执行
  │
  ├── 该 Agent/W-Agent 配置为「需要执行前确认」
  │   │
  │   ├── 用户在线
  │   │   → 弹出确认弹窗（Ant Design Modal）
  │   │   内容：任务名称、Agent 名称、预计耗时、输入参数摘要
  │   │   按钮：
  │   │     ├── 「立即执行」→ POST /api/scheduling/{id}/confirm-execute
  │   │     ├── 「延后」→ 弹出时间选择 → POST /api/scheduling/{id}/delay
  │   │     ├── 「跳过」→ POST /api/scheduling/{id}/skip
  │   │     └── 「取消」→ POST /api/scheduling/{id}/cancel
  │   │
  │   └── 用户不在线（超时未响应）
  │       → 30 分钟后（默认，可配置）
  │       → 执行默认动作：自动延后
  │       → 延后后重新请求确认
  │       → 超过最大重试次数后自动跳过
  │
  └── 该 Agent/W-Agent 配置为「无需执行前确认」
      → 直接执行
```

### 调度任务详情展开
点击任务行展开详情面板：
- 调用的 Agent/Workflow 链路
- 输入参数
- 输出结果（格式化展示，可切换 JSON）
- 执行日志（日志级别可切换：简洁 / 详细）
- 耗时
- 依赖关系

### 用户操作
| 操作 | 触发 | 结果 |
| --- | --- | --- |
| 点击「暂停调度计划」 | `POST /api/scheduling/plans/{id}/pause` | 暂停所有未执行的任务 |
| 点击「恢复调度计划」 | `POST /api/scheduling/plans/{id}/resume` | 恢复执行 |
| 点击「取消调度计划」 | 二次确认弹窗 → `POST /api/scheduling/plans/{id}/cancel` | 取消所有未执行任务 |
| 点击失败任务的「重试」 | `POST /api/scheduling/{id}/retry` | 重新加入执行队列 |
| 筛选状态 | URL query: `?status=failed` | 过滤显示 |

### 错误处理
- 任务执行失败：自动重试 3 次（指数退避），每次重试在日志中记录
- 重试耗尽：标记失败 + 推送通知
- 熔断触发：该 Agent 所有待执行任务标为「已阻塞」，监控面板顶部显示熔断告警横幅

---

## 7. 配置管理流程

### 7.1 Agent 配置（`/config/agents`）

**列表页操作：**
```
页面加载 → GET /api/config/agents → 渲染 Agent 列表卡片
  ├── 点击「新建 Agent」→ 跳转 /config/agents/new
  ├── 点击某 Agent 卡片 → 跳转 /config/agents/{id}
  ├── 点击启用/禁用开关
  │   ├── 禁用时检测是否有调度任务使用
  │   │   ├── 有：弹窗「该 Agent 正在被调度任务使用」
  │   │   │   选项：「禁用并重新编排」/「禁用并取消任务」/「取消禁用」
  │   │   └── 无：直接禁用
  │   └── 启用：直接启用
  └── 点击「测试连接」→ POST /api/config/agents/{id}/test
      → 成功：绿色 ✓ 提示
      → 失败：红色 ✗ + 错误详情
```

**详情/编辑页操作：**
```
表单字段：
  ├── 基础信息：名称、描述、能力标签
  ├── Dify 连接：API 端点、API Key
  ├── 输入参数表格：逐行添加（参数名、类型、必填、默认值、说明）
  ├── 输出参数表格：逐行添加（参数名、类型、说明）
  ├── 超时配置：最大等待秒数
  ├── 自动执行：开关（匹配时是否允许跳过确认）
  └── 执行前确认：开关（调度执行前是否需要确认弹窗）

保存 → PUT /api/config/agents/{id}
  → 成功：Toast「保存成功」→ 返回列表页
  → 失败：表单字段显示校验错误
```

### 7.2 Workflow 配置（`/config/workflows`）
与 Agent 配置流程基本一致，无「自动执行」和「执行前确认」配置。

### 7.3 W-Agent 配置（`/config/wagents`）

**新建/编辑 W-Agent：**
```
页面加载 → GET /api/config/workflows（获取可用 Workflow 列表）

编排操作（V1 列表式）：
  ├── 从左侧 Workflow 列表拖入或点击添加到步骤列表
  ├── 上下拖拽调整步骤顺序
  ├── 点击步骤展开参数映射面板
  │   ├── 显示该 Workflow 的输入参数
  │   ├── 每个输入参数选择数据来源：
  │   │   ├── 「上游 Workflow 输出」→ 下拉选择上游步骤 + 输出参数名
  │   │   ├── 「W-Agent 输入」→ 映射到 W-Agent 整体入参
  │   │   └── 「固定值」→ 手动填入
  │   └── 类型不兼容时显示黄色警告
  ├── 配置执行方式：串行 / 并行 / 条件分支
  ├── 定义 W-Agent 整体输入参数
  ├── 定义 W-Agent 整体输出参数
  ├── 配置自动执行 / 执行前确认开关
  │
  └── 点击「保存」
      → POST /api/config/wagents（新建）或 PUT /api/config/wagents/{id}（编辑）
      → 编辑已有 W-Agent 且正在执行中 → 保存为新版本
      → 成功：Toast「保存成功 (v{N})」
```

**版本管理（`/config/wagents/{id}/versions`）：**
```
页面加载 → GET /api/config/wagents/{id}/versions → 版本列表
  ├── 查看某版本详情
  ├── 两个版本差异对比
  └── 点击「回滚到此版本」→ 确认弹窗 → POST /api/config/wagents/{id}/rollback/{versionId}
```

### 7.4 数据源配置（`/config/datasources`）
```
页面展示 3 个数据源卡片（邮件、日程、项目进展）
每个卡片：
  ├── 配置 Dify Agent 端点、API Key
  ├── 输入参数配置
  ├── 输出参数配置
  ├── 启用/禁用开关
  ├── 测试连接按钮
  └── 手动同步按钮 → POST /api/datasources/{type}/sync
      → 触发立即同步 → Toast「同步已触发」
      → 同步完成后 SSE 推送结果
```

### 7.5 大模型配置（`/config/llm`）
```
页面分 3 个 Tab：待办梳理 LLM | 智能编排 LLM | 智能调度 LLM

每个 Tab 内：
  ├── 模型选择（提供商下拉 + 模型名称 + API 端点 + API Key）
  ├── 模型参数（Temperature 滑块、Top-P 滑块、Max Tokens 输入框）
  ├── Prompt 模板编辑器（代码编辑器 + 版本下拉选择）
  ├── 测试区域：输入样例数据 → 点击「测试」→ 显示 LLM 输出预览
  └── 保存 → PUT /api/config/llm/{type}

用量统计区域（页面底部）：
  ├── Token 用量趋势图（ECharts 折线图）
  ├── 各环节费用统计
  └── 用量预警阈值设置

偏好学习区域：
  ├── 查看历史偏好记录
  └── 重置偏好数据按钮（二次确认）
```

---

## 8. 消息中心流程

### 路由：`/messages`

### 页面加载
`GET /api/messages?page=1&size=50` → 获取消息列表

### 通知角标（全局顶部栏）
- SSE 推送新消息 → 角标数字 +1
- 角标数字 = 未读消息数
- 点击角标 → 下拉面板显示最近 5 条 → 点击「查看全部」→ 跳转 `/messages`

### 消息交互
```
消息列表：
  ├── 筛选栏：消息类型（全部/待确认/执行完成/执行失败/计划变更/同步/到期预警/循环触发）
  ├── 时间范围筛选
  │
  ├── 消息卡片
  │   ├── 图标 + 标题 + 时间 + 状态标签（未读/已读/已处理）
  │   │
  │   ├── 需确认类消息 → 显示「去确认」按钮
  │   │   ├── 智能梳理确认 → 跳转 /todos/review
  │   │   ├── 编排确认 → 跳转 /orchestration
  │   │   ├── 执行前确认 → 弹出确认弹窗
  │   │   └── 计划变更确认 → 跳转 /orchestration
  │   │
  │   └── 普通消息 → 点击标记已读 → 可跳转到相关页面
  │
  └── 批量操作：全部标记已读、删除已处理消息
```

---

## 9. 执行历史与数据分析流程

### 9.1 执行历史（`/history`）
```
页面加载 → GET /api/history?page=1&size=50

筛选：时间范围、Agent/W-Agent 名称、执行状态
排序：开始时间、耗时

点击某条记录 → 展开详情面板：
  ├── 执行链路（Agent → Workflow1 → Workflow2 → ...）
  ├── 输入参数（格式化 / JSON 切换）
  ├── 输出结果（格式化 / JSON 切换）
  ├── 执行日志（日志级别切换：简洁 / 详细）
  └── 耗时明细

导出 → 点击「导出」→ 选择格式（CSV / Excel）→ 下载文件
```

### 9.2 数据分析（`/history/analytics`）
```
页面加载 → 并行请求：
  ├── GET /api/analytics/agent-stats → Agent 维度统计
  ├── GET /api/analytics/task-stats → 任务维度统计
  └── GET /api/analytics/llm-usage → LLM 用量统计

图表展示（ECharts）：
  ├── Agent 调用频次柱状图
  ├── Agent 成功率饼图
  ├── 任务来源占比饼图
  ├── LLM Token 消耗趋势折线图
  └── 各环节费用对比条形图
```

---

## 10. 系统设置流程

### 路由：`/settings`

```
页面展示所有全局配置项（表单形式）：
  ├── 执行时间窗口：周一到周日，每天一行（开始时间 - 结束时间，或「不执行」）
  ├── 并发调度上限：数字输入框
  ├── 数据同步频率：下拉（每 30 分钟 / 每小时 / 每 2 小时 / 每天 / 自定义 cron）
  ├── 确认超时默认值：分钟输入框
  ├── 确认超时默认动作：下拉（自动延后 / 自动执行 / 自动跳过）
  ├── 最大确认重试次数：数字输入框
  ├── 自动重试次数：数字输入框
  ├── 自动重试间隔策略：下拉（指数退避 / 固定间隔）
  ├── 熔断阈值：数字输入框
  ├── 数据保留策略：
  │   ├── 消息保留天数
  │   ├── 执行历史保留天数
  │   └── 审计日志保留天数
  ├── 已完成任务归档天数
  └── Dify API 频率限制：QPS / QPM 输入框

保存 → PUT /api/settings → 成功：Toast「设置已保存」
```

---

## 11. 全局搜索流程

### 组件位置：顶部栏搜索框

```
用户在搜索框输入关键词（防抖 300ms）
  → GET /api/search?q={keyword}
  → 返回分类结果：
      ├── 待办任务（最多 5 条）
      ├── Agent/Workflow/W-Agent（最多 5 条）
      ├── 调度任务（最多 5 条）
      ├── 执行历史（最多 5 条）
      └── 消息（最多 5 条）
  → 下拉面板分组展示结果（关键词高亮）
  → 点击某条结果 → 跳转到对应详情页
  → 点击「查看全部 XX 结果」→ 展开全页搜索结果
```

---

## 12. 数据同步被动流程（后台自动触发）

```
定时器触发（按系统设置的频率）或 用户手动触发
  │
  → 后端依次调用 3 个数据源 Agent（Dify REST API）
  → 获取数据后合并
  → 调用 LLM（待办梳理）分析数据
    ├── 超过上下文窗口 → 先摘要再详细分析（两步法）
    └── 正常 → 直接分析
  → LLM 返回梳理结果（含自动去重）
  │
  ├── 有新待办 → 保存为待确认梳理结果
  │   → SSE 推送通知到前端
  │   → 前端顶部角标 +1
  │   → 外部渠道推送（如已配置）
  │
  ├── 有调度计划冲突 → LLM 自动调整计划
  │   → 保存调整后方案为待确认
  │   → 推送确认通知
  │
  └── 无变化 → 仅更新同步状态记录

同步失败处理：
  ├── 单个数据源失败 → 记录错误，继续其他数据源
  ├── 全部失败 → 缓存上次结果 → 推送告警通知
  └── Dify API 不可用 → 暂停同步 → 推送降级告警
```

---

## 13. SSE 实时推送事件清单

| 事件类型 | 触发场景 | 前端处理 |
| --- | --- | --- |
| `task.status_changed` | 调度任务状态变更 | 刷新调度面板对应行 |
| `task.confirm_required` | 需要执行前确认 | 弹出确认弹窗 |
| `sync.completed` | 数据源同步完成 | 刷新 Dashboard 同步状态 |
| `review.new` | 新梳理结果待确认 | 角标 +1，Toast 提示 |
| `orchestration.completed` | LLM 编排分析完成 | 刷新编排页面 |
| `orchestration.conflict` | 调度计划冲突需确认 | 角标 +1，Toast 提示 |
| `circuit_breaker.triggered` | 熔断触发 | 调度面板显示告警横幅 |
| `system.alert` | 系统异常告警 | 顶部显示告警条 |

SSE 端点：`GET /api/sse/events`（长连接，前端在应用初始化时建立）
