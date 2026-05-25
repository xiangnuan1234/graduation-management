# R2 文件上传功能 - 快速开始

## ✨ 功能特性

✅ **智能额度监控**：实时监控 R2 存储使用情况  
✅ **自动停止上传**：使用量达到 95% 时自动禁止上传，避免超额费用  
✅ **动态文件大小限制**：根据剩余空间自动调整单个文件最大大小  
✅ **可视化展示**：前端显示存储空间使用进度条和状态提示  
✅ **多级警告机制**：70% 注意 → 85% 警告 → 95% 禁止  

## 🚀 快速部署

### Windows 用户（推荐）

双击运行以下任一脚本：
- `setup-r2.bat` (命令提示符版本)
- `setup-r2.ps1` (PowerShell 版本，需要管理员权限)

### 手动部署

```bash
# 1. 进入后端目录
cd backend-workers

# 2. 创建 R2 存储桶
npx wrangler r2 bucket create graduation-files

# 3. 部署后端
npm run deploy
```

## 📊 额度说明

### Cloudflare R2 免费套餐
- **存储空间**：10 GB/月
- **写入操作**：100 万次/月
- **读取操作**：1000 万次/月

### 系统保护机制

| 使用率 | 状态 | 行为 |
|--------|------|------|
| < 70% | ✅ 正常 | 允许上传，最大 20MB |
| 70%-85% | ⚠️ 注意 | 允许上传，显示提示 |
| 85%-95% | 🔶 警告 | 允许上传，限制文件大小 |
| ≥ 95% | 🚫 禁止 | **停止上传**，避免超额 |

## 👀 前端展示

学生登录后可以在以下页面看到存储使用情况：
- 📄 **文档管理**页面
- 📝 **开题报告**页面

显示内容：
- 已用空间 / 总空间（例如：2.5 GB / 10 GB）
- 彩色进度条（绿→蓝→黄→红）
- 当前状态标签
- 最大允许上传文件大小

## 🔧 API 接口

获取存储使用统计：
```
GET /api/storage/usage
```

## 📁 新增文件清单

### 后端文件
- `backend-workers/src/utils/r2-monitor.js` - R2 额度监控核心逻辑
- `backend-workers/src/routes/storage.js` - 存储管理 API 路由

### 前端文件
- `frontend/src/api/storage.js` - 存储 API 调用封装

### 修改的文件
- `backend-workers/wrangler.toml` - 启用 R2 绑定
- `backend-workers/src/index.js` - 添加 storage 路由
- `backend-workers/src/routes/documents.js` - 集成额度检查
- `backend-workers/src/routes/proposals.js` - 集成额度检查
- `frontend/src/views/Documents.vue` - 添加存储统计展示
- `frontend/src/views/Proposals.vue` - 添加存储统计展示

### 文档和脚本
- `R2_SETUP.md` - 详细配置指南
- `setup-r2.bat` - Windows 批处理部署脚本
- `setup-r2.ps1` - PowerShell 部署脚本
- `README_R2.md` - 本文件

## ⚙️ 工作原理

### 上传流程
1. 用户选择文件并点击上传
2. 前端发送请求到后端
3. 后端检查 R2 使用统计
4. 如果使用率 ≥ 95%，拒绝上传并返回错误
5. 如果使用率 < 95%，计算动态文件大小限制
6. 验证文件大小是否符合要求
7. 上传文件到 R2 存储桶
8. 保存文件信息到数据库
9. 返回成功响应

### 额度检查逻辑
```javascript
// 每次上传前都会执行
const uploadCheck = await checkUploadAllowed(env);
if (!uploadCheck.allowed) {
  return errorResponse(uploadCheck.reason, 403);
}
```

## 🛡️ 安全保障

1. **防止超额费用**：95% 阈值自动停止上传
2. **文件大小限制**：动态调整，最大 20MB
3. **实时统计**：每次上传前都重新计算使用量
4. **前端提示**：清晰的状态提示和警告信息

## 📝 注意事项

⚠️ **重要提醒**：
1. 定期检查存储使用情况
2. 及时清理不需要的文件
3. 鼓励用户上传压缩文件
4. 建议在本地备份重要文件

## 🐛 故障排除

### 问题 1：上传失败，提示"R2 存储未配置"
**解决**：确保已创建 R2 存储桶并正确配置 `wrangler.toml`

### 问题 2：上传被拒绝，提示"存储空间不足"
**解决**：查看存储统计，如果使用率超过 95%，需要清理文件或联系管理员

### 问题 3：无法看到存储统计信息
**解决**：确认已登录且后端服务正常运行

## 📚 更多信息

详细配置和使用说明请查看：
- [R2_SETUP.md](./R2_SETUP.md) - 完整配置指南

官方文档：
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

## 💡 提示

- 系统会自动保护你的免费额度，无需担心意外费用
- 前端会清晰显示当前存储状态和可用空间
- 接近限额时会提前警告，给你充足时间清理文件
- 所有上传操作都会记录日志，方便追踪

---

**祝你使用愉快！** 🎉
