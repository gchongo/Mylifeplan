# MyLifePlan

个人长期规划与短期计划管理系统（MVP）。

## 文档

| 文件 | 说明 |
|------|------|
| [docs/requirements.md](docs/requirements.md) | 需求书 |
| [docs/data-model.md](docs/data-model.md) | 数据模型 |
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
- [x] 分流 + Memo 自动创建/删除/同步
- [x] Feed 写入与首页信息流
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

### 下一步（M5）
- Admin 用户与订阅管理
- 集成测试 + E2E 冒烟

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器 |
| `npm run build` | 生产构建 |
| `npm test` | 运行 Vitest |
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
