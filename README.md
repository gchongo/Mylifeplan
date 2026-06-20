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
- PostgreSQL 15+（Docker 或本地）

## 快速开始

```bash
cd d:\Mylifeplan

# 1. 安装依赖（含 Prisma 等 M1 新增包）
npm install

# 2. 启动 PostgreSQL（Docker）
docker compose up -d

# 3. 配置环境变量
copy .env.example .env
# 编辑 .env，设置 AUTH_SECRET（至少 32 字符）

# 4. 初始化数据库
npm run db:generate
npm run db:push
npm run db:seed

# 5. 启动开发服务器
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)

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
