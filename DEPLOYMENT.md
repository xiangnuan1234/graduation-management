# Cloudflare Pages 部署指南

## 前置准备

1. Cloudflare 账号（免费）
2. GitHub/GitLab/Bitbucket 账号
3. 后端已部署到 Railway（已完成）

---

## 步骤一：准备前端项目

### 1. 确认环境变量配置

已创建以下文件：
- `.env.development` - 开发环境配置
- `.env.production` - 生产环境配置
- `wrangler.toml` - Cloudflare 构建配置

### 2. 修改生产环境 API 地址

编辑 `frontend/.env.production`，将 API 地址改为你的 Railway 后端地址：

```env
VITE_API_BASE_URL=https://your-backend-url.railway.app/api
```

---

## 步骤二：推送到 Git 仓库

### 1. 初始化 Git（如果还没有）

```bash
cd frontend
git init
git add .
git commit -m "Initial commit for Cloudflare deployment"
```

### 2. 推送到 GitHub

```bash
# 在 GitHub 创建新仓库
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

**注意：** 确保 `.gitignore` 已包含敏感文件。

---

## 步骤三：部署到 Cloudflare Pages

### 方法一：通过 Cloudflare Dashboard（推荐）

1. **登录 Cloudflare Dashboard**
   - 访问：https://dash.cloudflare.com/
   - 进入 "Workers & Pages"

2. **创建 Pages 项目**
   - 点击 "Create a project" → "Connect to Git"
   - 选择你的 GitHub 仓库
   - 点击 "Begin setup"

3. **配置构建设置**
   - **Project name**: `graduation-management`（自定义）
   - **Production branch**: `main`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `frontend`（如果仓库包含前后端）

4. **设置环境变量**
   - 点击 "Environment variables"
   - 添加变量：
     ```
     VITE_API_BASE_URL = https://tranquil-courtesy-production-9b08.up.railway.app/api
     ```

5. **点击 "Save and Deploy"**
   - Cloudflare 会自动构建并部署
   - 等待几分钟完成

6. **获取域名**
   - 部署成功后，你会获得一个 `*.pages.dev` 域名
   - 例如：`graduation-management.pages.dev`

### 方法二：使用 Wrangler CLI

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 进入前端目录
cd frontend

# 构建项目
npm run build

# 部署到 Cloudflare Pages
wrangler pages deploy dist --project-name=graduation-management
```

---

## 步骤四：配置自定义域名（可选）

1. 在 Cloudflare Pages 项目中
2. 进入 "Custom domains"
3. 点击 "Set up a custom domain"
4. 输入你的域名（如：`grad.yourdomain.com`）
5. 按照提示配置 DNS 记录

---

## 步骤五：配置 CORS（后端）

确保 Railway 后端允许 Cloudflare Pages 域名访问：

编辑 `backend/index.js`，修改 CORS 配置：

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',  // 本地开发
    'https://graduation-management.pages.dev',  // Cloudflare Pages
    'https://your-custom-domain.com'  // 自定义域名
  ],
  credentials: true
}));
```

然后重新部署后端到 Railway。

---

## 步骤六：验证部署

1. **访问前端**
   ```
   https://graduation-management.pages.dev
   ```

2. **测试功能**
   - 登录系统
   - 检查 API 请求是否正常
   - 验证文件上传功能

3. **查看部署日志**
   - Cloudflare Dashboard → Pages → 你的项目 → "Deployments"
   - 查看构建和运行日志

---

## 常见问题

### 1. 构建失败

**问题：** `npm run build` 失败

**解决：**
```bash
# 本地测试构建
cd frontend
npm run build

# 检查错误信息
# 确保所有依赖已安装
npm install
```

### 2. API 请求失败

**问题：** 前端无法连接后端

**解决：**
- 检查 `.env.production` 中的 API 地址是否正确
- 确认 Railway 后端正在运行
- 检查浏览器控制台的 CORS 错误
- 在后端配置正确的 CORS 白名单

### 3. 路由 404 错误

**问题：** 刷新页面出现 404

**解决：**
在 `frontend/public` 目录下创建 `_redirects` 文件（已存在）：

```
/* /index.html 200
```

### 4. 环境变量未生效

**问题：** 生产环境仍使用 localhost

**解决：**
- 在 Cloudflare Dashboard 中检查环境变量配置
- 确保变量名为 `VITE_API_BASE_URL`
- 重新触发部署

---

## 后续更新

### 自动部署（Git 集成）

每次推送到 `main` 分支时，Cloudflare 会自动构建和部署：

```bash
git add .
git commit -m "Update feature"
git push origin main
```

### 手动部署

```bash
cd frontend
npm run build
wrangler pages deploy dist --project-name=graduation-management
```

---

## 性能优化建议

1. **启用缓存**
   - Cloudflare 自动缓存静态资源
   - 在 Pages 设置中启用 "Cache TTL"

2. **图片优化**
   - 使用 WebP 格式
   - 压缩图片大小

3. **代码分割**
   - Vite 自动进行代码分割
   - 使用懒加载路由

4. **CDN 加速**
   - Cloudflare 全球 CDN 自动生效
   - 可在 Dashboard 中查看性能指标

---

## 监控和分析

1. **Cloudflare Analytics**
   - 查看访问量、带宽使用
   - 监控性能指标

2. **Railway 监控**
   - 后端性能监控
   - 数据库查询分析

---

## 安全建议

1. **不要提交敏感信息到 Git**
   - 使用 `.env.local` 存储本地密钥
   - 在 `.gitignore` 中排除敏感文件

2. **启用 HTTPS**
   - Cloudflare Pages 默认启用 HTTPS
   - 强制 HTTPS 重定向

3. **API 速率限制**
   - 在后端实现速率限制
   - 防止滥用

4. **定期更新依赖**
   ```bash
   npm audit
   npm update
   ```

---

## 总结

✅ 前端部署到 Cloudflare Pages（免费、快速、全球 CDN）
✅ 后端运行在 Railway（支持 Node.js + MySQL）
✅ 自动部署（Git 推送触发）
✅ 自定义域名支持
✅ HTTPS 自动启用

如有问题，请查看：
- Cloudflare Docs: https://developers.cloudflare.com/pages/
- Railway Docs: https://docs.railway.app/
