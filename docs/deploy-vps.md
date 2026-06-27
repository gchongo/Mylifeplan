# VPS 部署指南（Linux，无需 Docker）

适用于 Ubuntu/Debian。产品名：**Meridian Plan**。

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
CREATE USER meridian WITH PASSWORD '你的强密码';
CREATE DATABASE meridian OWNER meridian;
GRANT ALL PRIVILEGES ON DATABASE meridian TO meridian;
\q
```

密码含 `@` 时，`.env` 里要写成 `%40`。

## 3. 部署代码

将项目代码放到服务器（例如 `/www/wwwroot/Meridian` 或 `~/Mylifeplan`），然后：

```bash
cd /path/to/Mylifeplan
npm install
```

## 4. 配置 .env

```bash
cp .env.example .env
nano .env
```

```env
DATABASE_URL="postgresql://meridian:你的密码URL编码@localhost:5432/meridian?schema=public"
AUTH_SECRET="使用 openssl rand -base64 32 生成的随机字符串"
COOKIE_SECURE="false"
NODE_ENV="production"
```

> **重要**：用 `http://IP:3000` 访问时，`COOKIE_SECURE` 必须为 `false`。启用 HTTPS 后改为 `true`。

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
pm2 start npm --name meridian -- start
pm2 save
pm2 startup
```

## 7. 防火墙与域名

云厂商安全组放行 **TCP 3000**（或 80/443 若使用 Nginx 反代）。

```bash
sudo ufw allow 3000/tcp
```

建议通过 Nginx 配置 HTTPS 与域名反代，详见你的主机商文档。

## 8. 更新

```bash
cd /path/to/Mylifeplan
# 同步最新代码后
npm install
npm run db:generate
npm run build
pm2 restart meridian
```

## 常见问题

| 错误 | 处理 |
|------|------|
| `P1000 Authentication failed` | 检查 `.env` 中 `DATABASE_URL` 用户名、密码与库名 |
| 外网 502 | `pm2 logs meridian`，确认 build 成功且进程在跑 |
| `CREATE: command not found` | SQL 要在 `sudo -u postgres psql` 里执行 |

演示账号与 seed 数据见 `prisma/seed.ts`，生产环境请修改默认密码或跳过 seed。
