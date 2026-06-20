# 路由文档

本文档定义用户端、后台与 API 路由。Cursor 实现时必须按此划分，不得随意新增顶级路由。

## 1. 用户端页面路由

| 路径 | 说明 | 权限 |
|------|------|------|
| `/login` | 登录 | 公开 |
| `/register` | 注册 | 公开 |
| `/` | 首页（信息流 + 甘特图 + 日历） | 登录用户 |
| `/tasks` | 任务列表 | 登录用户 |
| `/tasks/[id]` | 任务详情 | 登录用户 |
| `/tasks/new` | 新建任务 | 登录用户 |
| `/plans/long` | 长期规划（goal → phase → 关联任务） | 登录用户 |
| `/plans/short` | 短期计划（weekly / daily） | 登录用户 |
| `/plans/[id]` | 计划详情 | 登录用户 |
| `/memos` | 备忘录列表 | 登录用户 |

### 首页布局说明

- **桌面端（≥1024px）**：三区域同页——左侧信息流，右侧上甘特图、下日历。
- **移动端（<1024px）**：同一路径 `/`，底部 Tab 切换「动态 / 全局 / 执行」三块，不同时硬挤一屏。

## 2. 后台页面路由

| 路径 | 说明 | 权限 |
|------|------|------|
| `/admin/login` | 管理员登录（可与用户登录共用逻辑，role 校验） | 公开 |
| `/admin` | 后台首页（跳转用户列表） | admin |
| `/admin/users` | 用户列表 | admin |
| `/admin/users/[id]` | 用户详情 | admin |
| `/admin/subscriptions` | 订阅列表与管理 | admin |

**MVP 不包含**：`/admin/payments`、`/admin/orders`、`/admin/settings`（留 v2）。

## 3. API 路由

所有 API 需校验 session，并按 `user_id` 隔离数据。后台 API 额外校验 `role = admin`。

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/logout` | 登出 |
| GET | `/api/auth/session` | 当前会话 |

### 任务

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tasks` | 列表（支持 plan_id、parent_task_id 筛选） |
| POST | `/api/tasks` | 新建（触发分流 + Feed） |
| GET | `/api/tasks/[id]` | 详情 |
| PATCH | `/api/tasks/[id]` | 更新（日期变更触发 Memo 创建/删除 + Feed） |
| DELETE | `/api/tasks/[id]` | 删除（级联删除关联 Memo） |

### 计划

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/plans` | 列表（支持 type、parent_plan_id 筛选） |
| POST | `/api/plans` | 新建 |
| GET | `/api/plans/[id]` | 详情（含子计划、关联任务） |
| PATCH | `/api/plans/[id]` | 更新 |
| DELETE | `/api/plans/[id]` | 删除 |

### 备忘录

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/memos` | 备忘录列表 |
| PATCH | `/api/memos/[id]` | 编辑（同步回源 Task/Plan；若补全日期则触发回流） |
| DELETE | `/api/memos/[id]` | 删除（同时删除源 Task/Plan，需二次确认） |

### 首页聚合

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/feed` | 信息流（分页，按 created_at 倒序） |
| GET | `/api/calendar` | 日历数据（query: from, to） |
| GET | `/api/gantt` | 甘特图数据（query: from, to）；响应含 `effective_end`、`is_virtual_end` |

### 后台

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/users` | 用户列表 |
| GET | `/api/admin/users/[id]` | 用户详情 |
| PATCH | `/api/admin/users/[id]` | 启用/禁用 |
| GET | `/api/admin/subscriptions` | 订阅列表 |
| PATCH | `/api/admin/subscriptions/[id]` | 手动更新订阅状态 |

## 4. 中间件与守卫

- `/admin/*` 与 `/api/admin/*`：未登录 → 401；非 admin → 403。
- 用户端页面与 `/api/*`（除 auth）：未登录 → 重定向 `/login` 或 401。
- 所有读写操作必须带 `user_id` 过滤，禁止跨用户访问。
