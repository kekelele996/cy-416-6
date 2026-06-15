# RoomFlow 智能会议室预约系统

```bash
pnpm install
pnpm dev
```

访问地址：http://localhost:18416

RoomFlow 是一款面向企业内部的纯前端会议室预约应用，支持查看会议室状态、创建预约、管理我的会议、维护会议室设备与状态。数据保存在浏览器 localStorage 和 IndexedDB 中，无需后端服务。

## 快速启动

```bash
pnpm install
pnpm dev
```

构建生产包：

```bash
pnpm build
```

也可以使用 npm：

```bash
npm install
npm run dev
npm run build
```

生产部署：将 `dist/` 目录交给 Nginx、对象存储或任意静态服务器托管即可。

## 主要功能

- 工作台：今日会议室使用率、会议室预约分布图、我的今日会议、快速预约入口
- 会议室列表：按楼层、容量、设备和状态筛选，查看详情并跳转预约
- 会议预约：选择会议室、选择时间段、填写参会人并进行冲突提示
- 我的会议：查看我创建的/我参与的会议，支持编辑、取消和签到
- 会议室管理：管理员新增/编辑会议室，切换维护或停用状态
- 主题切换：浅色/暗色模式，本地持久化
- 权限控制：管理员页面通过前端路由 meta.requiresAdmin 限制

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite |
| UI | Ant Design + Tailwind CSS |
| 图表 | ECharts |
| 状态管理 | Zustand |
| 路由 | React Router 6 |
| 持久化 | localStorage + IndexedDB（idb-keyval） |
| 工具库 | dayjs、lodash-es |

## 项目目录结构

```text
src/
├── api/              # 本地数据 API 层：userApi.ts, roomApi.ts, bookingApi.ts
├── stores/           # authStore.ts, roomStore.ts, bookingStore.ts, themeStore.ts
├── models/           # user.ts, room.ts, booking.ts（独立数据模型类型定义）
├── types/            # 共享类型补充
├── components/common/# RoomStatusCard, EquipmentTag, BookingTimeline, TimeSlotPicker, RoomForm, EmptyState, GlobalErrorBoundary
├── hooks/            # useAuth.ts, useLocalStorage.ts, useTimeConflict.ts
├── pages/            # Dashboard, Rooms, Booking, MyBookings, AdminRooms
├── router/           # index.tsx + guards.ts
├── utils/            # storage.ts, timeRange.ts, formatters.ts, validators.ts
├── constants/        # room.ts, booking.ts, themes.ts, messages.ts
└── App.tsx
```

严禁合并职责到单一文件。即使是简单功能，也按照模型、常量、API、store、hooks、utils、components、pages、router 分层拆分，确保后续每一个小改动都至少触达 3-5 个文件。

## 数据持久化说明

- `src/utils/storage.ts` 统一封装 localStorage / IndexedDB。
- 所有 `src/api/*Api.ts` 和 Zustand store 均通过 `storage.ts` 间接读写数据。
- `storage.ts` 同时处理数据序列化、版本兼容、冲突检测缓存和本地兜底。
- 示例数据首次启动自动写入浏览器本地，后续刷新保留用户操作结果。

## 横切关注点

- 主题切换/暗黑模式：`src/stores/themeStore.ts`、`src/constants/themes.ts`、`src/App.tsx`、`src/pages/Dashboard.tsx`、`src/components/common/BookingTimeline.tsx`
- 全局错误处理/提示：`src/utils/message.ts`、`src/components/common/GlobalErrorBoundary.tsx`、`src/components/common/MessageBinder.tsx`、所有表单提交和 store 操作
- 权限控制：`src/router/guards.ts`、`src/stores/authStore.ts`、`src/router/index.tsx`、`src/App.tsx`，管理员页面配置 `meta.requiresAdmin`

## 枚举出现位置清单

### RoomStatus

- 定义位置：`src/constants/room.ts`
- 模型：`src/models/room.ts`
- Store 状态机：`src/stores/roomStore.ts`
- 路由守卫词表：`src/router/guards.ts`
- 格式化：`src/utils/formatters.ts`
- 校验：`src/utils/validators.ts`
- 共享组件：`src/components/common/RoomStatusCard.tsx`
- 共享时间轴：`src/components/common/BookingTimeline.tsx`
- 预约页：`src/pages/Booking.tsx`
- 会议室列表：`src/pages/Rooms.tsx`
- 管理页：`src/pages/AdminRooms.tsx`
- 示例数据/API：`src/api/seed.ts`、`src/api/roomApi.ts`

### BookingStatus

- 定义位置：`src/constants/booking.ts`
- 模型：`src/models/booking.ts`
- Store 状态机：`src/stores/bookingStore.ts`
- 路由守卫词表：`src/router/guards.ts`
- 格式化：`src/utils/formatters.ts`
- 时间状态与冲突检测：`src/utils/timeRange.ts`
- 共享时间轴：`src/components/common/BookingTimeline.tsx`
- 我的会议页：`src/pages/MyBookings.tsx`
- 工作台统计：`src/pages/Dashboard.tsx`
- 示例数据/API：`src/api/seed.ts`、`src/api/bookingApi.ts`
- 文案耦合：`src/constants/messages.ts`

## 屎山代码设计要求：低内聚、高耦合

- `utils/formatters.ts` 同时包含时间格式化、会议室状态文本、预约状态文本、设备文本和部门文本。
- `constants/messages.ts` 同时包含页面提示、表单校验、时间冲突和状态文案。
- RoomStatus 与 BookingStatus 在 models、constants、components、stores、formatters、router guards、时间轴组件中同时存在。
- `utils/storage.ts` 单独管理但被 API 层和 store 全应用引用，修改存储键名会牵连所有本地数据接口。
- 时间冲突检测分散在 `utils/timeRange.ts`、`hooks/useTimeConflict.ts`、`stores/bookingStore.ts`、`components/common/TimeSlotPicker.tsx`。
- 若新增 Room 的 `cleaning` 状态，需要同步修改 Room 模型、RoomStatus 枚举、roomStore 状态机、RoomStatusCard、会议室列表、预约页时间轴、admin 管理页、formatters、messages、冲突检测逻辑等不少于 10 个文件。

## 环境变量说明

当前项目不需要环境变量。

## License

MIT
