# VPS 部署指南（Linux，无需 Docker）

适用于 Ubuntu/Debian。仓库：<https://github.com/gchongo/Mylifeplan>

## 1. 安装环境

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt update
sudo apt install -y nodejs git postgresql postgresql-contrib
sudo npm install -g pm2
```

## 2. 创建数据库

```bash
sudo -u postgres psql
```

在 `postgres=#` 提示符下执行（**不要**在 bash 里直接敲 SQL）：

```sql
CREATE USER mylifeplan WITH PASSWORD '你的强密码';
CREATE DATABASE mylifeplan OWNER mylifeplan;
GRANT ALL PRIVILEGES ON DATABASE mylifeplan TO mylifeplan;
\q
```

密码含 `@` 时，`.env` 里要写成 `%40`。

## 3. 拉代码

```bash
cd ~
git clone https://github.com/gchongo/Mylifeplan.git
cd Mylifeplan
git pull   # 已有目录时更新到最新
npm install
```

## 4. 配置 .env

```bash
cp .env.example .env
nano .env
```

```env
DATABASE_URL="postgresql://mylifeplan:你的密码URL编码@localhost:5432/mylifeplan?schema=public"
AUTH_SECRET="openssl rand -base64 32 生成的字符串"
COOKIE_SECURE="false"
NODE_ENV="production"
```

> **重要**：用 `http://IP:3000` 访问时，`COOKIE_SECURE` 必须为 `false`。上 HTTPS 后改为 `true`。

验证数据库：

```bash
psql "$DATABASE_URL" -c "SELECT 1;"
```

## 5. 初始化并构建

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm run build
```

## 6. 启动

```bash
# 测试
npm start

# 另开终端
curl -I http://127.0.0.1:3000

# 常驻
pm2 start npm --name mylifeplan -- start
pm2 save
pm2 startup
```

## 7. 防火墙

云厂商安全组放行 **TCP 3000**（或 80 若用 Nginx）。

```bash
sudo ufw allow 3000/tcp
```

访问：`http://你的VPS公网IP:3000`

## 8. 更新代码

```bash
cd ~/Mylifeplan
git pull
npm install
npm run db:generate
npm run build
pm2 restart mylifeplan
```

## 种子账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 演示用户 | demo@mylifeplan.local | password123 |
| 管理员 | admin@mylifeplan.local | password123 |

## 常见问题

| 错误 | 处理 |
|------|------|
| `P1000 Authentication failed` | `.env` 改用 `mylifeplan` 用户，不是 `postgres` |
| `Cannot find module '../../lib/auth/password'` | `git pull` 或 `sed -i 's|../../lib/auth/password|../lib/auth/password|' prisma/seed.ts` |
| 外网 502 | `pm2 logs mylifeplan`，确认 build 成功且进程在跑 |
| `CREATE: command not found` | SQL 要在 `sudo -u postgres psql` 里执行 |
