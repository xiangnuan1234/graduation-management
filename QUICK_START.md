# 🚀 快速开始 - GitHub Actions 自动部署

## 📋 前置准备（10 分钟）

### 1. Cloudflare 账户
- ✅ 已有 Cloudflare 账户
- ✅ 已登录 [dash.cloudflare.com](https://dash.cloudflare.com)

### 2. GitHub 仓库
- ✅ 代码已推送到 `https://github.com/xiangnuan1234/graduation-management`
- ✅ 有权限修改仓库 Settings

---

## ⚡ 三步完成部署

### 第一步：获取 Cloudflare 凭证（5 分钟）

#### 1.1 创建 API Token

访问：[https://dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)

1. 点击 **Create Token**
2. 选择 **Edit Cloudflare Workers** 模板
3. 确认包含以下权限：
   - ✅ Account : Workers Scripts : Edit
   - ✅ Account : R2 Storage : Edit
   - ✅ Account : Pages : Edit
   - ✅ Account : D1 : Edit
4. 点击 **Continue to summary** → **Create Token**
5. **复制 Token**（只显示一次，妥善保存！）

#### 1.2 获取 Account ID

访问：[https://dash.cloudflare.com](https://dash.cloudflare.com)

在右侧栏找到你的账户，复制 **Account ID**

或者运行命令：
```bash
npx wrangler whoami
```

---

### 第二步：配置 GitHub Secrets（2 分钟）

#### 2.1 进入 Secrets 设置页面

访问：`https://github.com/xiangnuan1234/graduation-management/settings/secrets/actions`

或者：
1. 打开你的 GitHub 仓库
2. 点击 **Settings**
3. 左侧菜单：**Security** → **Secrets and variables** → **Actions**

#### 2.2 添加两个 Secrets

点击 **New repository secret**

**Secret 1:**
```
Name: CLOUDFLARE_API_TOKEN
Secret: [粘贴你的 API Token]
```

**Secret 2:**
```
Name: CLOUDFLARE_ACCOUNT_ID
Secret: [粘贴你的 Account ID]
```

✅ 完成后应该看到两个 Secrets 列表

---

### 第三步：推送代码触发部署（1 分钟）

```bash
# 1. 添加所有更改
git add .

# 2. 提交更改
git commit -m "feat: 添加 R2 文件上传功能和自动部署

- R2 智能额度监控和自动停止机制
- GitHub Actions 自动创建 R2 存储桶
- 前端存储使用情况可视化展示"

# 3. 推送到主分支
git push origin master
```

---

## 🎯 等待自动部署（约 3-5 分钟）

### 查看部署进度

访问：`https://github.com/xiangnuan1234/graduation-management/actions`

你会看到工作流正在运行：

```
Deploy to Cloudflare
├── deploy-workers (运行中...)
│   ├── Setup Node.js
│   ├── Install Dependencies
│   ├── Create R2 Bucket (if not exists)
│   ├── Verify R2 Configuration
│   └── Deploy to Cloudflare Workers
└── deploy-pages (等待中...)
    ├── Setup Node.js
    ├── Install Dependencies
    ├── Build Frontend
    └── Deploy to Cloudflare Pages
```

### 预期结果

✅ **deploy-workers** 成功：
- R2 Bucket 创建成功（或已存在）
- R2 配置验证通过
- Workers 部署成功

✅ **deploy-pages** 成功：
- 前端构建成功
- Pages 部署成功

---

## ✅ 验证部署成功

### 1. 检查 R2 存储桶

访问：[https://dash.cloudflare.com/?to=/:account/r2](https://dash.cloudflare.com/?to=/:account/r2)

应该能看到：
- ✅ Bucket 名称：`graduation-files`
- ✅ 状态：活跃

### 2. 测试 API

```bash
# 替换为你的 Workers 域名
curl https://graduation-management-api.xiangnuan.workers.dev/api/storage/usage
```

预期响应：
```json
{
  "code": 200,
  "data": {
    "enabled": true,
    "storage": {
      "used": 0,
      "usedFormatted": "0 B",
      "limit": 10737418240,
      "limitFormatted": "10 GB",
      "usagePercent": "0.00"
    },
    "status": "normal",
    "uploadAllowed": true
  }
}
```

### 3. 访问前端应用

访问你的 Cloudflare Pages 域名（例如：`https://graduation-management.pages.dev`）

1. 使用管理员账户登录：`admin / admin123`
2. 进入"文档管理"页面
3. 应该能看到存储空间使用情况卡片
4. 尝试上传一个小文件测试

---

## 🎉 完成！

现在你已经成功：

✅ 配置了 GitHub Actions 自动部署  
✅ 创建了 R2 存储桶  
✅ 部署了后端 Workers  
✅ 部署了前端 Pages  
✅ 启用了智能额度监控  

---

## 📊 后续操作

### 日常使用

每次推送代码到 `master` 分支，都会自动触发部署：

```bash
git add .
git commit -m "你的更改说明"
git push origin master
```

### 查看部署历史

访问：`https://github.com/xiangnuan1234/graduation-management/actions`

可以看到所有部署记录和日志。

### 监控 R2 使用情况

1. **前端查看**：学生登录后在"文档管理"或"开题报告"页面
2. **API 查询**：`GET /api/storage/usage`
3. **Dashboard 查看**：[Cloudflare R2 Dashboard](https://dash.cloudflare.com/?to=/:account/r2)

---

## 🔍 故障排除

### 问题 1：GitHub Actions 失败

**检查：**
1. Secrets 是否正确配置（名称和值）
2. API Token 是否有足够权限
3. Account ID 是否正确

**解决：**
查看详细错误日志，根据提示修复

### 问题 2：R2 Bucket 创建警告

**现象：**
`Create R2 Bucket` 步骤显示错误

**原因：**
Bucket 已经存在

**解决：**
这是正常的！工作流配置了 `continue-on-error: true`，会忽略这个错误

### 问题 3：前端无法访问 API

**检查：**
1. Workers 是否成功部署
2. CORS 配置是否正确
3. 浏览器控制台的网络请求

**解决：**
查看 Workers 日志，确认 API 端点可访问

---

## 📚 相关文档

- 📖 [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md) - GitHub Secrets 详细配置指南
- 📖 [GITHUB_DEPLOY_CHECKLIST.md](./GITHUB_DEPLOY_CHECKLIST.md) - 完整部署检查清单
- 📖 [README_R2.md](./README_R2.md) - R2 功能快速开始
- 📖 [R2_SETUP.md](./R2_SETUP.md) - R2 详细配置指南

---

## 💡 提示

### 安全建议

- 🔒 永远不要将 API Token 提交到代码仓库
- 🔒 定期轮换 API Token（建议每 90 天）
- 🔒 只授予必要的权限
- 🔒 监控 R2 使用情况

### 最佳实践

- 📝 每次部署前在本地测试
- 📝 使用有意义的 commit message
- 📝 定期检查 GitHub Actions 日志
- 📝 监控 R2 存储使用情况

---

## 🆘 需要帮助？

如果遇到问题：

1. 🔍 查看 GitHub Actions 日志
2. 🔍 查看 Cloudflare Dashboard 错误信息
3. 🔍 参考相关文档
4. 🔍 检查浏览器控制台

---

**准备好了吗？现在开始部署吧！** 🚀

预计总时间：**10 分钟配置 + 5 分钟部署 = 15 分钟完成！**
