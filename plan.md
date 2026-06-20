# 项目执行计划（guideline for Cursor）

## 0. 项目启动文档

在开始编码前，必须阅读以下文档：

- `docs/requirements.md`
- `docs/plan.md`（本文件）
- `docs/data-model.md`
- `docs/routes.md`

Cursor 每次修改代码前必须先阅读这些文档。

## 阶段 1：项目初始化

### 任务 1.1：初始化仓库和目录
- 创建 `app` / `components` / `lib` / `types` / `docs`
- 创建用户端页面目录（见 `docs/routes.md`）
- 创建后台页面目录
- 创建公共组件目录
- 创建 API/数据访问层目录

**验收标准**
- 项目目录结构清晰。
- 可以正常启动本地开发环境。

### 任务 1.2：全局布局
- 顶部导航、侧栏/主菜单、主内容区、移动端菜单
- 桌面首页三区域骨架；移动端底部 Tab（动态/全局/执行）

**验收标准**
- 首页、任务页、备忘录页、规划页、后台页可切换。
- 页面不报错。

### 任务 1.3：全局 UI 基础组件
- Button / Input / Textarea / Select / Modal / Card / Badge / EmptyState / Loading / ErrorMessage

**验收标准**
- 组件可独立展示，样式统一。

## 阶段 2：数据模型与数据库

### 任务 2.1：用户模型
- id, email, password_hash, name, avatar, role, created_at, updated_at

### 任务 2.2：任务模型
- id, user_id, title, description, status, priority, start_date, due_date, parent_task_id, plan_id, created_at, updated_at
- 校验：禁止 due without start；due >= start

### 任务 2.3：计划模型
- id, user_id, title, description, type, parent_plan_id, start_date, end_date, status, created_at, updated_at
- type: goal / phase / weekly / daily
- 校验：phase 父级必须是 goal；end without start 禁止

### 任务 2.4：备忘录模型
- id, user_id, title, description, linked_task_id, linked_plan_id, created_at, updated_at
- 约束：linked_task_id 与 linked_plan_id 有且仅有一个非空

### 任务 2.5：信息流模型
- id, user_id, item_type, item_id, action_type, content, created_at

### 任务 2.6：订阅模型
- id, user_id, plan_name, status, start_at, end_at, payment_status, created_at, updated_at

### 任务 2.7：分流服务
- 实现 `lib/content-router.ts`（按 data-model 决策表）
- 实现 `getEffectiveEndDate(item, today)`（虚拟截止：max(start+365, today)）

**验收标准**
- 所有模型字段与 `docs/data-model.md` 一致。
- 关系与校验可在数据库/ORM 层表达。

## 阶段 3：认证与用户空间

- 任务 3.1：注册
- 任务 3.2：登录
- 任务 3.3：权限隔离（user_id 过滤 + admin 路由守卫）

**验收标准**
- 用户可注册并登录，只能看到自己的数据。
- 普通用户不能访问 `/admin/*`。

## 阶段 4：任务与计划录入

- 任务 4.1：新增任务表单（含日期校验）
- 任务 4.2：新增计划表单（含 type、parent_plan_id）
- 任务 4.3：父任务 / 父计划选择逻辑
- 任务 4.4：表单校验与错误提示

**验收标准**
- 任务/计划可新增并保存。
- 层级关系正确；禁止非法日期组合。

## 阶段 5：业务分流规则

- 任务 5.1：新增/变更写入 Feed
- 任务 5.2：按决策表写入日历查询结果
- 任务 5.3：按决策表写入甘特图查询结果
- 任务 5.4：无日期自动创建 Memo
- 任务 5.5：补日期硬删除 Memo 并回流
- 任务 5.6：编辑 title/description 同步 Memo

**验收标准**
- 与 `docs/data-model.md` 第 7 节决策表完全一致。
- 补日期后 Memo 不存在；清空日期后 Memo 重新出现。

## 阶段 6：首页三块实现

- 任务 6.1：信息流模块
- 任务 6.2：甘特图模块（有 start 即展示；无 due/end 时用虚拟 effective_end，虚线/标签区分）
- 任务 6.3：日历模块（有 start 即显示）
- 任务 6.4：桌面三区域 + 移动 Tab 整合

**验收标准**
- 首页三块数据真实，分流正确。

## 阶段 7：任务管理页

- 任务 7.1：任务列表
- 任务 7.2：任务详情
- 任务 7.3：任务编辑（含 Memo 同步）
- 任务 7.4：状态流转与父任务汇总展示

**验收标准**
- 列表/详情/编辑/状态正常。

## 阶段 8：备忘录模块

- 任务 8.1：备忘录列表
- 任务 8.2：补日期回流（删 Memo）
- 任务 8.3：删除/归档

**验收标准**
- 无日期内容统一展示；编辑与源记录同步。

## 阶段 9：长期规划与短期计划页面

- 任务 9.1：长期规划页（goal → phase → 任务）
- 任务 9.2：短期计划页（weekly / daily）

**验收标准**
- 计划类型与层级展示正确；任务关联可见。

## 阶段 10：后台管理（MVP）

- 任务 10.1：管理员入口与守卫
- 任务 10.2：用户列表与详情
- 任务 10.3：订阅列表与手动状态更新

**验收标准**
- 后台功能正常；无支付对接要求。

## 阶段 11：测试任务

- 任务 11.1：`content-router` 单元测试（决策表 + `getEffectiveEndDate` 虚拟截止动态计算）
- 任务 11.2：分流 + Memo 同步/删除集成测试
- 任务 11.3：权限与非法日期校验测试
- 任务 11.4：首页三模块冒烟测试

**验收标准**
- 分流相关测试全部通过。

## 执行规则

每次任务遵循：

1. 先阅读 `docs/requirements.md`、`docs/data-model.md`、`docs/routes.md`、`docs/plan.md`。
2. 只完成当前任务。
3. 不允许修改无关模块。
4. 完成后给出：修改文件、实现功能、本地测试步骤、剩余风险。
5. 依赖未完成则停止并说明。
