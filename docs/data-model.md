# 数据模型文档

## 概述

本文档定义所有核心数据模型及其字段、关系和约束。Cursor 在实现时必须严格按此文档定义模型，不得随意新增/修改字段。

## 1. 用户模型（User）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 主键 |
| email | string | 是 | 邮箱，唯一 |
| password_hash | string | 是 | 密码哈希 |
| name | string | 否 | 用户名 |
| avatar | string | 否 | 头像 URL |
| role | enum | 是 | user / admin |
| created_at | datetime | 是 | 创建时间 |
| updated_at | datetime | 是 | 更新时间 |

**关系**
- 一个用户拥有多个任务、计划、备忘录、信息流、订阅。

## 2. 任务模型（Task）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 主键 |
| user_id | string | 是 | 所属用户 |
| title | string | 是 | 标题 |
| description | string | 否 | 描述 |
| status | enum | 是 | todo / in_progress / done |
| priority | enum | 否 | high / medium / low |
| start_date | date | 否 | 开始日期（UTC 日期） |
| due_date | date | 否 | 截止日期（UTC 日期） |
| parent_task_id | string | 否 | 父任务 ID |
| plan_id | string | 否 | 所属计划 ID |
| created_at | datetime | 是 | 创建时间 |
| updated_at | datetime | 是 | 更新时间 |

**关系**
- `parent_task_id` 指向同表的另一个任务 ID（可为空）。
- `plan_id` 指向计划（phase / weekly / daily 均可）。

**约束**
- 禁止「仅有 due_date、没有 start_date」：若填写截止日期，必须同时填写开始日期。
- 若 start_date 与 due_date 均存在，则 due_date >= start_date。
- 父子层级最多 3 层；禁止循环引用。
- 无 start_date 且无 due_date 的任务可保存，但不进入日历/甘特图，并自动创建 Memo。

## 3. 计划模型（Plan）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 主键 |
| user_id | string | 是 | 所属用户 |
| title | string | 是 | 标题 |
| description | string | 否 | 描述 |
| type | enum | 是 | goal / phase / weekly / daily |
| parent_plan_id | string | 否 | 父计划 ID |
| start_date | date | 否 | 开始日期 |
| end_date | date | 否 | 结束日期 |
| status | enum | 是 | not_started / in_progress / done |
| created_at | datetime | 是 | 创建时间 |
| updated_at | datetime | 是 | 更新时间 |

**关系**
- `parent_plan_id` 指向同表的另一个计划 ID（可为空）。
- 一个计划可关联多个任务（Task.plan_id）。

**层级规则**
- `goal`：长期目标，`parent_plan_id` 必须为空。
- `phase`：阶段计划，`parent_plan_id` 必须指向 type 为 `goal` 的计划。
- `weekly` / `daily`：短期计划，`parent_plan_id` 可为空，或指向 type 为 `phase` 的计划。

**约束**
- 禁止「仅有 end_date、没有 start_date」：若填写结束日期，必须同时填写开始日期。
- 若 start_date 与 end_date 均存在，则 end_date >= start_date。
- 无 start_date 且无 end_date 的计划可保存，但不进入日历/甘特图，并自动创建 Memo。

## 4. 备忘录模型（Memo）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 主键 |
| user_id | string | 是 | 所属用户 |
| title | string | 是 | 标题（与关联源同步） |
| description | string | 否 | 描述（与关联源同步） |
| linked_task_id | string | 否 | 关联任务 ID |
| linked_plan_id | string | 否 | 关联计划 ID |
| created_at | datetime | 是 | 创建时间 |
| updated_at | datetime | 是 | 更新时间 |

**关系**
- `linked_task_id` 与 `linked_plan_id` 有且仅有一个非空。

**约束**
- 无日期的任务/计划进入备忘录时，系统自动创建一条 Memo 并关联源记录。
- 编辑任务/计划时，若存在关联 Memo，必须同步更新 Memo 的 title 与 description。
- 补充日期满足回流条件后，**硬删除**对应 Memo 记录（不软删除、不保留历史 Memo）。
- 若任务/计划被删除，关联 Memo 一并删除。

## 5. 信息流模型（Feed）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 主键 |
| user_id | string | 是 | 所属用户 |
| item_type | enum | 是 | task / plan / memo |
| item_id | string | 是 | 关联内容 ID |
| action_type | enum | 是 | create / update / complete / archive |
| content | string | 否 | 附加说明（如标题快照） |
| created_at | datetime | 是 | 创建时间 |

**关系**
- 记录任务、计划、备忘录相关动作日志。

**约束**
- 新增、编辑（含日期/状态变更）、完成、归档均写入 Feed。
- MVP 不包含复盘（review）类型。

## 6. 订阅模型（Subscription）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 主键 |
| user_id | string | 是 | 所属用户 |
| plan_name | string | 是 | 套餐名称 |
| status | enum | 是 | active / expired / cancelled |
| start_at | datetime | 是 | 开始时间 |
| end_at | datetime | 是 | 结束时间 |
| payment_status | enum | 是 | pending / paid / failed |
| created_at | datetime | 是 | 创建时间 |
| updated_at | datetime | 是 | 更新时间 |

**关系**
- 一个用户可有多条订阅记录（历史记录保留；当前有效订阅由 status = active 标识）。

**MVP 说明**
- 不接真实支付网关；管理员在后台手动维护订阅状态。
- MVP 不建 Order / Payment 表。

## 关系图（文字版）

```
User
 ├── Task (1:N)
 ├── Plan (1:N)
 ├── Memo (1:N)
 ├── Feed (1:N)
 └── Subscription (1:N)

Task
 ├── parent_task_id → Task.id
 └── plan_id → Plan.id

Plan
 ├── parent_plan_id → Plan.id
 └── Task.plan_id ← Task (1:N)

Memo
 ├── linked_task_id → Task.id
 └── linked_plan_id → Plan.id
```

## 7. 视图分流规则（实现约束）

分流由 `lib/content-router.ts` 统一计算，各视图只读规则结果，不各自写 if/else。

### 甘特图虚拟截止日期（核心规则）

当条目**有 start、尚无 due/end** 时，甘特图仍展示时间条，但截止日为**计算值**，不写入数据库：

```
DEFAULT_GANTT_SPAN_DAYS = 365

effective_end =
  due_date 或 end_date（若已填写）
  否则 max(start_date + 365 天, today_utc_date)
```

说明：

- **不持久化**：虚拟截止日仅存于 API 响应与甘特图渲染层；`due_date` / `end_date` 字段保持为空，直至用户明确填写。
- **动态变化**：每次请求 `/api/gantt` 或渲染甘特图时，按当天 `today_utc_date` 重新计算。随时间推移，若 `start + 365` 早于今天，截止日自动延长到今天，使进行中的开放条目在时间轴上保持可见。
- **确定截止**：用户填写 `due_date` / `end_date` 后，立即改用真实截止日，停止虚拟计算。
- **UI 标识**：使用虚拟截止的条目，甘特条需有视觉区分（如虚线边框或「预估截止」标签）。

实现函数：`getEffectiveEndDate(item, today)`，供甘特图与 `/api/gantt` 共用。

### 任务（Task）

| start_date | due_date | 日历 | 甘特图 | 备忘录 |
|------------|----------|------|--------|--------|
| 无 | 无 | ✗ | ✗ | ✓（创建 Memo） |
| 有 | 无 | ✓ | ✓（虚拟 effective_end） | ✗ |
| 有 | 有 | ✓ | ✓（真实 due_date） | ✗ |
| 无 | 有 | — | — | **禁止保存（校验错误）** |

### 计划（Plan）

| start_date | end_date | 日历 | 甘特图 | 备忘录 |
|------------|----------|------|--------|--------|
| 无 | 无 | ✗ | ✗ | ✓（创建 Memo） |
| 有 | 无 | ✓ | ✓（虚拟 effective_end） | ✗ |
| 有 | 有 | ✓ | ✓（真实 end_date） | ✗ |
| 无 | 有 | — | — | **禁止保存（校验错误）** |

### 日期变更时的 Memo 处理

- 进入备忘录条件：清空全部日期 → 创建 Memo。
- 离开备忘录条件：满足日历条件 → 硬删除 Memo。
- 编辑标题/描述：源记录与 Memo 双向同步（以 Task/Plan 为权威源）。

## 约束总结

- 所有 datetime 存 UTC；date 字段仅存日期（无时分秒）。
- email 唯一。
- role 只能是 user / admin。
- 任务/计划可以无日期保存，但无日期时不进日历/甘特图。
- 仅有 start 时，甘特图使用虚拟 effective_end，不自动写入 due_date/end_date。
- 父任务状态汇总（只读推导，不自动写库）：
  - 全部子任务 done → 父任务显示 done。
  - 任一子任务 in_progress，或部分 done → 父任务显示 in_progress。
  - 其余 → 父任务显示 todo。
