# GitHub Secrets 配置指南

## 📋 需要配置的 Secrets

为了让 GitHub Actions 能够自动部署你的项目并创建 R2 存储桶，你需要在 GitHub 仓库中配置以下 Secrets：

### 必需的配置

1. **CLOUDFLARE_API_TOKEN** - Cloudflare API Token
2. **CLOUDFLARE_ACCOUNT_ID** - Cloudflare Account ID

---

## 🔑 获取 Cloudflare API Token

### 步骤 1：登录 Cloudflare Dashboard

访问 [https://dash.cloudflare.com](https://dash.cloudflare.com) 并登录你的账户

### 步骤 2：创建 API Token

1. 点击右上角头像 → **My Profile**
2. 左侧菜单选择 **API Tokens**
3. 点击 **Create Token**
4. 选择 **Edit Cloudflare Workers** 模板（或自定义）

### 步骤 3：配置 Token 权限

确保 Token 具有以下权限：

#### Workers & Pages
- ✅ Account : Workers Scripts : **Edit**
- ✅ Account : Workers KV Storage : **Edit**
- ✅ Account : Workers R2 Storage : **Edit**
- ✅ Account : Pages : **Edit**

#### D1 Database
- ✅ Account : D1 : **Edit**

#### R2 Storage
- ✅ Account : R2 Storage : **Edit**

### 步骤 4：生成并复制 Token

1. 点击 **Continue to summary**
2. 点击 **Create Token**
3. **立即复制 Token**（只显示一次！）
4. 保存到一个安全的地方

---

## 🆔 获取 Cloudflare Account ID

### 方法 1：从 Dashboard 获取

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 在右侧栏找到你的账户
3. Account ID 显示在账户名称下方

### 方法 2：从 URL 获取

访问任何 Cloudflare 服务页面，URL 中包含 Account ID：
```
https://dash.cloudflare.com/{ACCOUNT_ID}/...
```

### 方法 3：使用 wrangler CLI

```bash
npx wrangler whoami
```

会显示类似：
```
Account ID: 694b74c6d5ec82483435f345f50e6af6
```

---

## ⚙️ 在 GitHub 中配置 Secrets

### 步骤 1：进入仓库设置

1. 打开你的 GitHub 仓库：`https://github.com/xiangnuan1234/graduation-management`
2. 点击顶部菜单的 **Settings**
3. 左侧菜单找到 **Security** → **Secrets and variables** → **Actions**

### 步骤 2：添加 Secrets

点击 **New repository secret**，添加以下两个：

#### Secret 1: CLOUDFLARE_API_TOKEN

- **Name**: `CLOUDFLARE_API_TOKEN`
- **Secret**: 粘贴你刚才复制的 API Token
- 点击 **Add secret**

#### Secret 2: CLOUDFLARE_ACCOUNT_ID

- **Name**: `CLOUDFLARE_ACCOUNT_ID`
- **Secret**: 粘贴你的 Account ID（例如：`694b74c6d5ec82483435f345f50e6af6`）
- 点击 **Add secret**

### 步骤 3：验证配置

你应该看到两个 Secrets：
- ✅ `CLOUDFLARE_API_TOKEN`
- ✅ `CLOUDFLARE_ACCOUNT_ID`

---

## 🚀 触发自动部署

配置好 Secrets 后，有两种方式触发部署：

### 方式 1：推送代码到主分支

```bash
git add .
git commit -m "feat: 添加 R2 文件上传功能和自动部署配置"
git push origin master
```

GitHub Actions 会自动触发部署流程。

### 方式 2：手动触发（可选）

如果你想添加手动触发功能，可以更新 `.github/workflows/deploy.yml`：

```yaml
on:
  push:
    branches: [main, master]
  workflow_dispatch:  # 添加这一行
```

然后在 GitHub 仓库的 **Actions** 标签页可以手动运行工作流。

---

## 📊 查看部署状态

### 查看部署进度

1. 进入仓库的 **Actions** 标签页
2. 点击最新的部署工作流
3. 查看详细日志：
   - ✅ Create R2 Bucket (if not exists)
   - ✅ Verify R2 Configuration
   - ✅ Deploy to Cloudflare Workers
   - ✅ Deploy Frontend Pages

### 常见问题

#### 问题 1：R2 Bucket 创建失败

**现象**：`Create R2 Bucket` 步骤显示错误

**原因**：Bucket 可能已经存在

**解决**：这是正常的，`continue-on-error: true` 会忽略这个错误

#### 问题 2：权限不足

**现象**：部署失败，提示权限错误

**原因**：API Token 权限配置不正确

**解决**：
1. 检查 API Token 是否包含 R2、Workers、Pages 的 Edit 权限
2. 重新创建 Token 并更新 Secret

#### 问题 3：Account ID 错误

**现象**：提示找不到账户

**原因**：Account ID 填写错误

**解决**：
1. 从 Cloudflare Dashboard 重新复制 Account ID
2. 更新 `CLOUDFLARE_ACCOUNT_ID` Secret

---

## ✅ 验证部署成功

### 1. 检查 R2 存储桶

访问 [Cloudflare Dashboard → R2](https://dash.cloudflare.com/?to=/:account/r2)

应该能看到 `graduation-files` 存储桶

### 2. 测试文件上传

1. 访问你的前端应用
2. 登录学生账号
3. 进入"文档管理"页面
4. 查看存储空间使用情况（应该显示正常）
5. 尝试上传一个小文件测试

### 3. 查看 API 响应

```bash
curl https://你的域名/api/storage/usage
```

应该返回存储使用统计信息。

---

## 🔒 安全建议

### 1. 保护 API Token

- ✅ 永远不要将 Token 提交到代码仓库
- ✅ 只授予必要的权限
- ✅ 定期轮换 Token（建议每 90 天）
- ❌ 不要在聊天、邮件中分享 Token

### 2. 最小权限原则

API Token 只需要以下权限：
- Workers Scripts: Edit
- R2 Storage: Edit
- Pages: Edit
- D1: Edit

不需要全局管理员权限！

### 3. 监控使用情况

定期检查：
- R2 存储使用量
- API 调用次数
- GitHub Actions 运行记录

---

## 📝 快速检查清单

在推送代码前，确认：

- [ ] 已在 Cloudflare 创建 API Token
- [ ] API Token 包含所需权限
- [ ] 已获取正确的 Account ID
- [ ] 已在 GitHub 配置 `CLOUDFLARE_API_TOKEN` Secret
- [ ] 已在 GitHub 配置 `CLOUDFLARE_ACCOUNT_ID` Secret
- [ ] `wrangler.toml` 中包含 R2 配置
- [ ] 代码已提交到主分支（master/main）

---

## 🆘 需要帮助？

如果遇到问题：

1. 查看 GitHub Actions 日志
2. 检查 Cloudflare Dashboard 的错误信息
3. 参考官方文档：
   - [Cloudflare Workers CI/CD](https://developers.cloudflare.com/workers/ci-cd/)
   - [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**祝你部署顺利！** 🎉
