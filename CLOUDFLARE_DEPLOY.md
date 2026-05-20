# Cloudflare 部署快速指南

## 📋 项目结构

```
项目/
├── backend-workers/          # Cloudflare Workers 后端（新建）
│   ├── src/
│   │   ├── index.js         # 主入口
│   │   ├── utils.js         # 工具函数
│   │   ├── middleware.js    # 中间件
│   │   └── routes/          # 路由处理
│   ├── migrations/
│   │   └── schema.sql       # 数据库迁移
│   ├── wrangler.toml        # Workers 配置
│   └── package.json
└── frontend/                 # Vue3 前端（已有）
    └── wrangler.toml        # Pages 配置
```

## 🚀 快速部署步骤

### 第一步：部署后端（Cloudflare Workers）

```bash
# 1. 进入后端目录
cd backend-workers

# 2. 安装依赖
npm install

# 3. 登录 Cloudflare
npx wrangler login

# 4. 创建 D1 数据库
npm run db:create
# ⚠️ 复制输出的 database_id，更新 wrangler.toml 中的 database_id

# 5. 执行数据库迁移（创建表）
npm run db:migrate

# 6. 创建 R2 存储桶
npm run r2:create

# 7. 本地测试（可选）
npm run dev
# 访问 http://localhost:8787

# 8. 部署到 Cloudflare
npm run deploy
# ✅ 记录输出的 URL，例如：https://graduation-management-api.xxx.workers.dev
```

### 第二步：配置前端 API 地址

编辑 `frontend/.env.product人先RX 3RRR

```javascript
VITE_API_BASE_URL=https://你的-workers-url.workers.dev/api
```

编辑 `frontend/src/utils/request.js`，将默认 baseURL 改为：

```javascript
baseURL: import.meta.env.VITE_API_BASE_URL || 'https://你的-workers-url.workers.dev/api',
```

### 第三步：部署前端（Cloudflare Pages）

```bash
# 1. 进入前端目录
cd frontend

# 2. 安装依赖（如果还没安装）
npm install

# 3. 构建项目
npm run build

# 4. 部署到 Cloudflare Pages
npx wrangler pages deploy dist
```

或者通过 Cloudflare Dashboard 部署（推荐）：

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages** → **Create Application** → **Pages**
3. 连接你的 Git 仓库
4. 设置：
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `frontend`
5. 点击 **Deploy**

## ✨ 完成！

部署成功后你将获得：
- 前端：`https://your-project.pages.dev`
- 后端：`https://your-api.workers.dev`

## 🔧 重要配置检查清单

- [ ] `backend-workers/wrangler.toml` 中的 `database_id` 已填写
- [ ] `backend-workers/wrangler.toml` 中的 `FRONTEND_URL` 已设置为前端地址
- [ ] `frontend/.env.production` 中的 API 地址已更新为 Workers URL
- [ ] 数据库迁移已执行（所有表已创建）
- [ ] R2 存储桶已创建

## 🧪 测试

1. 访问前端 URL
2. 使用默认账户登录：
   - 用户名：admin
   - 密码：admin123
3. 测试各项功能

## 📝 常见问题

### Q: 如何查看后端日志？
```bash
cd backend-workers
npx wrangler tail
```

### Q: 如何查看数据库内容？
```bash
npx wrangler d1 execute graduation-db --command="SELECT * FROM user"
```

### Q: 如何更新代码？
```bash
# 后端
cd backend-workers
npm run deploy

# 前端
cd frontend
npm run build
npx wrangler pages deploy dist
```

### Q: 文件上传后如何访问？
文件路径格式：`https://你的-workers-url.workers.dev/files/proposals/xxx.pdf`

## 💰 费用

Cloudflare 免费套餐完全够用：
- ✅ Workers: 每天 100,000 次请求
- ✅ D1: 每天 100,000 行读取
- ✅ R2: 10GB 存储
- ✅ Pages: 无限站点和请求

## 🎯 下一步

1. 绑定自定义域名（可选）
2. 配置 CI/CD 自动部署
3. 添加监控和告警

---

**祝你部署顺利！** 🎉
