# MyLifePlan

个人长期规划与短期计划管理系统（MVP）。

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
- PostgreSQL 15+（本机安装或 VPS，**不必 Docker**）

详细 VPS 步骤见 **[docs/deploy-vps.md](docs/deploy-vps.md)**。

## 快速开始（本地 Windows）

```bash
npm install
copy .env.example .env
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

## 快速开始（Linux VPS）

```bash
git clone https://github.com/gchongo/Mylifeplan.git
cd Mylifeplan
npm install
cp .env.example .env   # 编辑 DATABASE_URL 与 AUTH_SECRET
npm run db:generate && npm run db:push && npm run db:seed
npm run build
pm2 start npm --name mylifeplan -- start
```

完整说明见 [docs/deploy-vps.md](docs/deploy-vps.md)。

### 种子账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@mylifeplan.local | password123 |
| 演示用户 | demo@mylifeplan.local | password123 |

## 当前进度

### M0 ✅
- Next.js 骨架、路由、Layout、UI 组件、首页三区域

### M1 ✅
- [x] Prisma 六表 schema
- [x] 注册 / 登录 / 登出 / Session API
- [x] JWT Cookie 会话 + Middleware 守卫
- [x] Zod 校验（auth + task/plan 日期）
- [x] Seed 脚本（admin + demo）
- [x] Docker Compose PostgreSQL

### M2 ✅
- [x] Task / Plan CRUD API
- [x] 分流 + Feed 写入与首页信息流
- [x] 便签与计划分离（B 模型，见 [docs/content-flows.md](docs/content-flows.md)）
- [x] 新建任务 / 计划表单
- [x] 备忘录列表与补日期回流

### M3 ✅
- [x] `/api/gantt` 甘特图数据（含 virtual effective_end）
- [x] `/api/calendar` 日历数据
- [x] 首页甘特图时间条（虚线 = 预估截止）
- [x] 首页日历月视图
- [x] 任务详情页

### M4 ✅
- [x] 长期规划 goal → phase 树形展示
- [x] 计划详情页（子计划、关联任务、内嵌新建任务）
- [x] 任务详情编辑 / 删除 / 状态快捷操作
- [x] 父计划 / 父任务 / 关联计划下拉选择器
- [x] 父任务汇总状态展示（展示层推导）

### M5 ✅
- [x] Admin 用户列表 / 详情 / 启用禁用（`is_active`）
- [x] Admin 订阅列表 / 手动 PATCH
- [x] 禁用用户无法登录
- [x] Vitest：memo-sync 集成 + task-rollup + admin 校验

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
