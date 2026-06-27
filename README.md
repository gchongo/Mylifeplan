# Meridian Plan

个人长期规划与短期计划管理系统（MVP）。**Meridian Plan** — 让时间看得见 · Make time visible。

## 文档

| 文件 | 说明 |
|------|------|
| [docs/requirements.md](docs/requirements.md) | 需求书 |
| [docs/data-model.md](docs/data-model.md) | 数据模型 |
| [docs/content-flows.md](docs/content-flows.md) | **便签 / 计划 / 贡献流转线路** |
| [docs/routes.md](docs/routes.md) | 路由与 API |
| [docs/plan.md](docs/plan.md) | Cursor 执行清单 |
| [docs/development-plan.md](docs/development-plan.md) | 开发计划 |

## 环境要求

- Node.js 20+
- npm 10+
- PostgreSQL 15+

生产部署步骤见 **[docs/deploy-vps.md](docs/deploy-vps.md)**。

## 快速开始（本地）

```bash
npm install
copy .env.example .env   # Windows；Linux/macOS 使用 cp
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

浏览器访问 http://localhost:3000 。首次使用请在注册页创建账号，或通过 seed 脚本初始化演示数据（详见 `.env.example` 与 `prisma/seed.ts`）。

## 当前进度

### M0 ✅
- Next.js 骨架、路由、Layout、UI 组件、首页三区域

### M1 ✅
- Prisma 六表 schema
- 注册 / 登录 / 登出 / Session API
- JWT Cookie 会话 + Middleware 守卫
- Zod 校验（auth + task/plan 日期）
- Seed 脚本

### M2 ✅
- Task / Plan CRUD API
- 分流 + Feed 写入与首页信息流
- 便签与计划分离（B 模型，见 [docs/content-flows.md](docs/content-flows.md)）
- 新建任务 / 计划表单
- 备忘录列表与补日期回流

### M3 ✅
- `/api/gantt` 甘特图数据（含 virtual effective_end）
- `/api/calendar` 日历数据
- 首页甘特图时间条（虚线 = 预估截止）
- 首页日历月视图
- 任务详情页

### M4 ✅
- 长期规划 goal → phase 树形展示
- 计划详情页（子计划、关联任务、内嵌新建任务）
- 任务详情编辑 / 删除 / 状态快捷操作
- 父计划 / 父任务 / 关联计划下拉选择器
- 父任务汇总状态展示（展示层推导）

### M5 ✅
- Admin 用户列表 / 详情 / 启用禁用（`is_active`）
- Admin 订阅列表 / 手动 PATCH
- 禁用用户无法登录
- Vitest：memo-sync 集成 + task-rollup + admin 校验

### MVP 完成 + 需求补全

M0～M5 全部交付，并补齐需求缺口：

- 备忘录：编辑 / 删除 / 归档 UI
- 任务与计划归档（`archived` 状态 + Feed）
- 长期规划 goal → phase → 任务树
- 甘特图：层级缩进 + 时间范围选择
- 日历：月 / 周 / 日视图
- 任务列表：树形展开 + 父任务汇总
- 信息流：可点击跳转 + 加载更多
- Playwright 冒烟测试（`npm run test:e2e`）

## 记录流转（摘要）

完整线路见 **[docs/content-flows.md](docs/content-flows.md)**。三类主记录：**独立便签**、**计划**、**贡献**。

| 记录 | 典型落点 | 变成计划 |
|------|----------|----------|
| 独立便签 | 便签板、信息流 | 「转为计划」→ 未排期或排期，原便签删除 |
| 计划·未排期 | 看板紫列 | 已是计划，补日期后进甘特 |
| 计划·已排期 | 看板 + 甘特 + 日历 | 拖列改 `status` |
| 计划·已归档 | 看板底部折叠区 | 拖回四列恢复 |
| 贡献 | 绑定计划、信息流 | 不单独变便签 |

**不做的事**：未排期计划不会自动生成便签；便签板不显示计划。

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器 |
| `npm run build` | 生产构建 |
| `npm test` | 运行 Vitest |
| `npm run test:e2e` | Playwright 冒烟（需先 `npx playwright install`） |
| `npm run lint` | ESLint |

## 目录结构

```
app/           # Next.js App Router 页面
components/    # UI 与业务组件
lib/           # 工具与核心逻辑（content-router）
types/         # TypeScript 类型
docs/          # 项目文档
tests/         # 测试
```
