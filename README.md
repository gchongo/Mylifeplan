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

### 下一步（M2）
- Task / Plan CRUD API
- 分流 + Memo 联动 + Feed 写入

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
