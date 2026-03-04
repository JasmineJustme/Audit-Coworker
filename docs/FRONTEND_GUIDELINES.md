# FRONTEND_GUIDELINES.md — Audit Coworker 前端设计规范

> 完整的设计系统。每个视觉决策都已锁定。
> AI 创建任何组件时必须参考此文档，不得使用随机颜色或不一致的间距。

---

## 1. 设计原则

- **一致性**：所有页面遵循统一的视觉语言和交互模式
- **信息密度适中**：审计场景数据量大，但不牺牲可读性
- **操作可逆**：关键操作需二次确认，状态变更可追溯
- **即时反馈**：每个操作都有明确的成功/失败反馈
- **中文优先**：所有界面文案使用中文，无英文混排

---

## 2. 主题与色彩

### 2.1 Ant Design 主题配置（ConfigProvider theme）

使用 Ant Design 6.x 默认蓝色主题，基于 Token 系统自定义如下：

```typescript
const theme = {
  token: {
    // 品牌色（Ant Design 默认蓝）
    colorPrimary: '#1677ff',
    colorInfo: '#1677ff',

    // 成功色
    colorSuccess: '#52c41a',

    // 警告色
    colorWarning: '#faad14',

    // 错误色
    colorError: '#ff4d4f',

    // 文字色
    colorText: 'rgba(0, 0, 0, 0.88)',
    colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
    colorTextTertiary: 'rgba(0, 0, 0, 0.45)',
    colorTextQuaternary: 'rgba(0, 0, 0, 0.25)',

    // 背景色
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f5f5f5',
    colorBgElevated: '#ffffff',

    // 边框色
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#f0f0f0',

    // 圆角
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,

    // 字体
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,

    // 行高
    lineHeight: 1.5714,

    // 间距
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,
    margin: 16,
    marginLG: 24,
    marginSM: 12,
    marginXS: 8,
  },
  components: {
    Layout: {
      siderBg: '#001529',
      headerBg: '#ffffff',
      headerHeight: 56,
      headerPadding: '0 24px',
    },
    Menu: {
      darkItemBg: '#001529',
      darkSubMenuItemBg: '#000c17',
      darkItemSelectedBg: '#1677ff',
    },
  },
};
```

### 2.2 业务语义色（非 Ant Design Token，用于自定义组件）

| 语义 | 色值 | 用途 |
| --- | --- | --- |
| 任务-待确认 | `#1677ff` (蓝) | 待确认状态标签、角标 |
| 任务-待执行 | `#8c8c8c` (灰) | 待执行状态标签 |
| 任务-待确认执行 | `#1677ff` (蓝) | 执行前确认状态 |
| 任务-执行中 | `#fa8c16` (橙) | 执行中状态、进度条 |
| 任务-已完成 | `#52c41a` (绿) | 完成状态标签 |
| 任务-失败 | `#ff4d4f` (红) | 失败状态标签、告警 |
| 任务-已跳过 | `#bfbfbf` (浅灰) | 跳过状态标签 |
| 任务-已阻塞 | `#722ed1` (紫) | 阻塞状态标签 |
| 任务-已暂停 | `#fadb14` (黄) | 暂停状态标签 |
| 来源-邮件 | `#1890ff` (蓝) | 邮件来源图标/标签 |
| 来源-日程 | `#52c41a` (绿) | 日程来源图标/标签 |
| 来源-项目进展 | `#fa8c16` (橙) | 项目来源图标/标签 |
| 来源-手动 | `#8c8c8c` (灰) | 手动录入来源 |
| 优先级-高 | `#ff4d4f` (红) | 高优先级标签 |
| 优先级-中 | `#faad14` (黄) | 中优先级标签 |
| 优先级-低 | `#52c41a` (绿) | 低优先级标签 |

---

## 3. 字体规范

### 3.1 字体栈

```css
font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB',
  'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
```

中文优先级：苹方 → 冬青黑体 → 微软雅黑

### 3.2 字号层级

| 层级 | 字号 | 行高 | 字重 | 用途 |
| --- | --- | --- | --- | --- |
| H1 页面标题 | 24px | 32px | 600 | 页面主标题（每页仅一个） |
| H2 区块标题 | 20px | 28px | 600 | 卡片/区块标题 |
| H3 小标题 | 16px | 24px | 600 | 表单分组标题、Tab 标题 |
| Body 正文 | 14px | 22px | 400 | 表格内容、表单标签、正文文字 |
| Caption 辅助 | 12px | 20px | 400 | 时间戳、辅助说明、占位文字 |
| 微文字 | 12px | 18px | 400 | 标签内文字、角标 |

### 3.3 代码/JSON 字体

```css
font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
```

用于 Prompt 编辑器、JSON 展示、日志详情。

---

## 4. 间距系统

基于 **4px 基准网格**（所有间距值为 4 的倍数）。

| Token | 值 | 用途 |
| --- | --- | --- |
| `--space-xxs` | 4px | 图标与文字间距、紧凑标签内边距 |
| `--space-xs` | 8px | 按钮组间距、标签间距 |
| `--space-sm` | 12px | 表单项间距、列表项内边距 |
| `--space-md` | 16px | 卡片内边距、区块间距（默认） |
| `--space-lg` | 24px | 页面级区块间距、大卡片内边距 |
| `--space-xl` | 32px | 页面上下留白 |
| `--space-xxl` | 48px | 大区域分隔 |

### 4.1 页面布局间距

```
页面容器:
  padding: 24px          （主内容区内边距）
  
区块间距:
  margin-bottom: 24px    （卡片/区块之间）
  
卡片内:
  padding: 24px          （卡片内边距）
  标题与内容: 16px       （标题下方间距）
```

---

## 5. 布局规则

### 5.1 全局布局

```
+-------------------------------------------------------+
|  Header: height=56px, bg=#fff, shadow                  |
|  [Logo] [全局搜索栏 width=400px] [通知角标] [用户头像]   |
+----------+--------------------------------------------+
|          |                                            |
| Sider    |  Content                                   |
| width=   |  padding=24px                              |
| 220px    |  max-width=100%                            |
| (折叠时  |  overflow-y=auto                           |
|  60px)   |                                            |
|          |                                            |
+----------+--------------------------------------------+
```

### 5.2 侧边栏

- 展开宽度：220px
- 折叠宽度：60px
- 背景色：`#001529`（深蓝黑）
- 文字色：`rgba(255, 255, 255, 0.65)`
- 选中项背景：`#1677ff`
- 选中项文字：`#ffffff`
- 分组标题：12px 大写，`rgba(255, 255, 255, 0.35)`
- 菜单项高度：40px
- 分组间距：8px 分隔线

### 5.3 内容区域

- 最小宽度：800px（小于此宽度出现横向滚动）
- 面包屑导航在页面标题上方（非必须，配置子页面使用）
- 页面标题区域：H1 + 可选操作按钮（右对齐）

---

## 6. 响应式断点

| 断点名称 | 宽度 | 布局调整 |
| --- | --- | --- |
| `xxl` | >= 1600px | 全功能桌面布局 |
| `xl` | >= 1200px | 标准桌面布局 |
| `lg` | >= 992px | 侧边栏自动折叠 |
| `md` | >= 768px | 侧边栏隐藏为抽屉式，内容全宽 |
| `sm` | >= 576px | 表格改为卡片列表，简化表单布局 |
| `xs` | < 576px | 移动端竖屏，单列布局 |

### 6.1 响应式规则

- **>= 1200px**：标准双栏（侧边栏 + 内容区）
- **992px ~ 1199px**：侧边栏自动折叠为图标模式（60px）
- **768px ~ 991px**：侧边栏隐藏，通过汉堡按钮打开抽屉式导航
- **< 768px**：全屏单列布局，表格转为卡片列表，操作按钮改为底部固定栏

---

## 7. 组件使用规范

### 7.1 表格（Table）

- 使用 Ant Design `<Table>` 组件
- 所有表格带分页（默认 pageSize=20）
- 必须指定 `rowKey`
- 超长文字用 `ellipsis: true` + Tooltip
- 操作列固定在右侧（`fixed: 'right'`）
- 操作按钮使用文字链接，不用按钮样式
- 表头背景色：`#fafafa`

### 7.2 表单（Form）

- 使用 Ant Design `<Form>` 组件
- 标签位置：左对齐（`labelCol={{ span: 6 }}`）
- 必填项标红色 `*`
- 校验失败时字段下方显示红色提示文字
- 保存按钮在表单底部右对齐
- 长表单使用 `<Card>` 分区

### 7.3 弹窗（Modal）

- 确认类弹窗宽度：416px（Ant Design 默认 `confirm` 尺寸）
- 表单类弹窗宽度：640px
- 大型弹窗（如参数映射）：800px 或全屏抽屉 `<Drawer>`
- 弹窗内不嵌套弹窗，使用抽屉替代
- 危险操作（删除、取消）使用 `danger` 样式按钮

### 7.4 卡片（Card）

- 默认带阴影：`boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)'`
- 卡片间距：24px
- 可折叠卡片使用 `<Collapse>` 或卡片内嵌折叠区
- Dashboard 指标卡片使用 `<Statistic>` 组件

### 7.5 状态标签（Tag）

使用 Ant Design `<Tag>` 的 `color` 属性映射任务状态色：

```typescript
const STATUS_TAG_MAP = {
  pending_confirm: { color: 'blue', text: '待确认' },
  pending: { color: 'default', text: '待执行' },
  confirming: { color: 'blue', text: '待确认执行' },
  running: { color: 'orange', text: '执行中' },
  completed: { color: 'success', text: '已完成' },
  failed: { color: 'error', text: '失败' },
  skipped: { color: 'default', text: '已跳过' },
  blocked: { color: 'purple', text: '已阻塞' },
  paused: { color: 'warning', text: '已暂停' },
};
```

### 7.6 按钮规范

- 主操作：`type="primary"`（每个区域最多 1 个主按钮）
- 次要操作：`type="default"`
- 危险操作：`danger`
- 文字链接操作：`type="link"`
- 按钮间距：8px
- 加载状态：操作期间显示 `loading` + 禁用

### 7.7 通知反馈

| 场景 | 组件 | 用法 |
| --- | --- | --- |
| 操作成功 | `message.success()` | Toast 3 秒自动消失 |
| 操作失败 | `message.error()` | Toast 5 秒自动消失 |
| 需要关注 | `notification.warning()` | 右上角通知卡片 |
| 关键确认 | `Modal.confirm()` | 居中弹窗，需用户操作 |
| 执行前确认 | 自定义 `<ConfirmModal>` | 全局弹窗组件 |

### 7.8 空状态

- 所有列表/表格无数据时显示 Ant Design `<Empty>` 组件
- 首次使用且未配置时显示引导性空状态（配图 + 操作按钮）
- 搜索无结果：「未找到匹配结果，请调整关键词」

### 7.9 加载状态

- 页面级加载：`<Spin>` 居中
- 区块级加载：`<Skeleton>` 骨架屏
- 按钮级加载：按钮 `loading` 属性
- LLM 分析中：自定义加载动画 + 文字提示「AI 正在分析...」

---

## 8. CSS Modules 规范

### 8.1 文件命名

```
ComponentName/
  ├── index.tsx           // 组件逻辑
  ├── index.module.css    // 样式文件
  └── types.ts            // 类型定义（可选）
```

### 8.2 类名规范

- 使用 camelCase：`.pageContainer`, `.headerTitle`, `.statusTag`
- 不使用 BEM（CSS Modules 已解决作用域问题）
- 组件根元素类名统一为 `.root`

### 8.3 样式编写规则

- 使用 CSS 变量引用间距（`var(--space-md)` 等）
- 不直接写 Ant Design 内部类名（`.ant-xxx`）覆盖样式
- 需要覆盖 Ant Design 样式时使用 `:global(.ant-xxx)` 包裹
- 颜色统一引用 Ant Design Token 或业务语义色常量

---

## 9. 图表规范（ECharts）

### 9.1 通用配置

```typescript
const CHART_DEFAULTS = {
  grid: { top: 40, right: 24, bottom: 40, left: 60 },
  tooltip: { trigger: 'axis' },
  legend: { top: 0, right: 0 },
  color: ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2'],
};
```

### 9.2 图表类型对应场景

| 场景 | 图表类型 |
| --- | --- |
| 任务完成趋势 | 折线图 |
| Agent 调用频次排行 | 水平柱状图 |
| 任务来源占比 | 饼图/环形图 |
| LLM Token 消耗趋势 | 面积图 |
| Agent 成功率 | 饼图 |
| 执行耗时分布 | 柱状图 |

### 9.3 甘特图配置（dhtmlx-gantt）

- 时间粒度：默认按小时，支持切换到按天
- 任务条颜色：使用任务状态色映射
- 只读模式（V1）：禁用拖拽

---

## 10. 文件与目录结构

```
frontend/
  src/
    ├── api/                    # API 请求模块（按业务分文件）
    │   ├── client.ts           # Axios 实例配置
    │   ├── todos.ts
    │   ├── orchestration.ts
    │   ├── scheduling.ts
    │   ├── config.ts
    │   ├── messages.ts
    │   ├── dashboard.ts
    │   ├── history.ts
    │   ├── search.ts
    │   ├── settings.ts
    │   └── sse.ts              # SSE 连接管理
    │
    ├── components/             # 通用组件
    │   ├── Layout/             # 全局布局（Header + Sider + Content）
    │   ├── ConfirmModal/       # 执行前确认弹窗（全局）
    │   ├── StatusTag/          # 状态标签
    │   ├── PriorityTag/        # 优先级标签
    │   ├── SourceTag/          # 来源标签
    │   ├── JsonViewer/         # JSON 格式化/原始切换
    │   ├── ParamTable/         # 输入/输出参数配置表格
    │   ├── ParamMappingPanel/  # Workflow 参数映射面板
    │   ├── ReasonCollapse/     # LLM 推荐理由折叠区
    │   └── SearchBar/          # 全局搜索栏
    │
    ├── pages/                  # 页面组件（按路由对应）
    │   ├── Setup/
    │   ├── Dashboard/
    │   ├── Todos/
    │   │   ├── index.tsx       # 待办列表
    │   │   └── Review/         # 梳理确认
    │   ├── Orchestration/
    │   ├── Scheduling/
    │   ├── History/
    │   │   ├── index.tsx       # 执行历史
    │   │   └── Analytics/      # 数据分析
    │   ├── Config/
    │   │   ├── Agents/
    │   │   ├── Workflows/
    │   │   ├── WAgents/
    │   │   ├── DataSources/
    │   │   ├── LLM/
    │   │   ├── Notifications/
    │   │   └── ImportExport/
    │   ├── Messages/
    │   ├── Settings/
    │   │   ├── index.tsx       # 系统设置
    │   │   └── NotificationPrefs/
    │   └── AuditLogs/
    │
    ├── stores/                 # Zustand 状态仓库
    │   ├── useAuthStore.ts     # 预留用户状态（V1 空实现）
    │   ├── useNotificationStore.ts  # 未读消息数、通知列表
    │   ├── useSSEStore.ts      # SSE 连接状态
    │   └── useGlobalStore.ts   # 侧边栏折叠状态等
    │
    ├── hooks/                  # 自定义 Hooks
    │   ├── useSSE.ts           # SSE 连接与事件监听
    │   ├── useConfirmModal.ts  # 执行前确认弹窗控制
    │   └── usePagination.ts    # 分页参数管理
    │
    ├── constants/              # 常量定义
    │   ├── status.ts           # 状态枚举与色值映射
    │   ├── routes.ts           # 路由路径常量
    │   └── menu.ts             # 侧边栏菜单配置
    │
    ├── types/                  # TypeScript 类型定义
    │   ├── api.ts              # API 请求/响应类型
    │   ├── todo.ts
    │   ├── agent.ts
    │   ├── workflow.ts
    │   ├── wagent.ts
    │   ├── schedule.ts
    │   ├── message.ts
    │   └── settings.ts
    │
    ├── utils/                  # 工具函数
    │   ├── format.ts           # 日期格式化、数字格式化
    │   └── excel.ts            # Excel 解析/导出
    │
    ├── theme/                  # 主题配置
    │   └── antdTheme.ts        # Ant Design Token 配置
    │
    ├── App.tsx                 # 根组件（路由 + ConfigProvider）
    ├── main.tsx                # 入口文件
    └── vite-env.d.ts           # Vite 类型声明
```
