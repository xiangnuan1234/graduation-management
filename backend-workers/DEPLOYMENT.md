# 毕业设计管理系统 - Cloudflare Workers 后端部署指南

## 前置要求

1. 安装 Node.js (v18+)
2. 注册 Cloudflare 账号
3. 安装 Wrangler CLI

## 快速开始

### 1. 安装依赖

```bash
cd backend-workers
npm install
```

### 2. 登录 Cloudflare

```bash
npx wrangler login
```

### 3. 创建 D1 数据库

```bash
npm run db:create
```

执行后会输出类似：
```
✅ Successfully created DB 'graduation-db'
Created database ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**重要**：复制 database_id，然后更新 `wrangler.toml` 文件中的 `database_id` 字段。

### 4. 执行数据库迁移

```bash
npm run db:migrate
```

这会创建所有必需的数据表。

### 5. 创建 R2 存储桶

```bash
npm run r2:create
```

### 6. 配置环境变量

编辑 `wrangler.toml`，更新以下字段：

```toml
[vars]
JWT_SECRET = "your-secret-key-here"
FRONTEND_URL = "https://your-frontend.pages.dev"
```

### 7. 本地开发测试

```bash
npm run dev
```

访问 `http://localhost:8787` 进行测试。

### 8. 部署到 Cloudflare

```bash
npm run deploy
```

部署成功后会获得一个 URL，例如：
```
https://graduation-management-api.your-subdomain.workers.dev
```

## 前端配置

更新前端的 API 地址：

### 修改 `frontend/src/utils/request.js`

```javascript
const request = axios.create({
  baseURL: 'https://graduation-management-api.your-subdomain.workers.dev/api',
  timeout: 10000,
})
```

### 修改 `frontend/.env.production`

```
VITE_API_BASE_URL=https://graduation-management-api.your-subdomain.workers.dev/api
```

## 部署前端到 Cloudflare Pages

```bash
cd frontend
npm install
npm run build

# 使用 Wrangler 部署
npx wrangler pages deploy dist
```

或者通过 Cloudflare Dashboard：
1. 进入 Cloudflare Pages
2. 连接你的 Git 仓库
3. 设置构建命令：`npm run build`
4. 设置输出目录：`dist`
5. 部署

## 默认账户

首次登录时会自动创建管理员账户：
- 用户名：admin（或你首次登录时使用的用户名）
- 密码：admin123

## 注意事项

### 1. 密码哈希
当前使用 SHA-256 + salt 进行密码哈希。生产环境建议使用 bcryptjs 的 WebAssembly 版本以获得更高的安全性。

### 2. 文件上传
文件存储在 Cloudflare R2，访问路径为：
```
https://graduation-management-api.your-subdomain.workers.dev/files/{file_path}
```

### 3. CORS 配置
确保在 `wrangler.toml` 中正确配置了 `FRONTEND_URL`。

### 4. 数据库限制
Cloudflare D1 是 SQLite 数据库，与 MySQL 有一些语法差异：
- 使用 `datetime('now')` 代替 `NOW()`
- 使用 `AUTOINCREMENT` 代替 `AUTO_INCREMENT`
- 外键约束默认启用

## 常用命令

```bash
# 查看数据库内容
npx wrangler d1 execute graduation-db --command="SELECT * FROM user"

# 查看 R2 存储桶
npx wrangler r2 object list graduation-files

# 查看 Worker 日志
npx wrangler tail
```

## 故障排查

### 问题：CORS 错误
解决：检查 `wrangler.toml` 中的 `FRONTEND_URL` 是否正确。

### 问题：数据库连接失败
解决：确认 `wrangler.toml` 中的 `database_id` 已正确填写。

### 问题：文件上传失败
解决：确认 R2 存储桶已创建并在 `wrangler.toml` 中正确配置。

## 升级和维护

### 更新代码后重新部署
```bash
npm run deploy
```

### 添加新的数据库迁移
在 `migrations/` 目录下创建新的 SQL 文件，然后执行：
```bash
npx wrangler d1 execute graduation-db --file=./migrations/your-migration.sql
```

## 费用说明

Cloudflare Workers 免费套餐：
- 每天 100,000 次请求
- D1 数据库：每天 100,000 行读取，5,000 行写入
- R2 存储：10GB 存储，每月 100 万次读取操作

对于毕业设计项目，免费套餐完全够用！
