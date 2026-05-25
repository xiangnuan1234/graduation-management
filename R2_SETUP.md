# R2 文件上传功能配置指南

## 概述

本系统已集成 Cloudflare R2 对象存储服务，用于存储学生上传的文档和开题报告。系统包含智能额度监控功能，当存储空间接近免费额度上限时会自动停止上传，避免产生额外费用。

## R2 免费额度

Cloudflare R2 提供免费套餐：
- **存储空间**：每月 10 GB
- **A 类操作**（写入、列表等）：每月 100 万次
- **B 类操作**（读取等）：每月 1000 万次

## 配置步骤

### 1. 创建 R2 存储桶

使用 wrangler CLI 创建存储桶：

```bash
cd backend-workers
npm run r2:create
```

或者手动创建：

```bash
npx wrangler r2 bucket create graduation-files
```

### 2. 验证 wrangler.toml 配置

确保 `backend-workers/wrangler.toml` 中包含以下配置：

```toml
[[r2_buckets]]
binding = "FILES"
bucket_name = "graduation-files"
```

### 3. 部署后端

```bash
npm run deploy
```

### 4. 测试上传功能

登录系统后，在"文档管理"或"开题报告"页面查看存储空间使用情况，并尝试上传文件。

## 额度监控机制

### 自动监控

系统在每次文件上传前都会检查 R2 使用情况：

1. **正常状态**（< 70%）：允许上传，最大文件大小 20MB
2. **注意状态**（70%-85%）：允许上传，显示提示信息
3. **警告状态**（85%-95%）：允许上传，但限制文件大小
4. **严重状态**（≥ 95%）：**禁止上传**，避免超出免费额度

### 动态文件大小限制

系统会根据剩余空间动态调整单个文件的最大大小：
- 最大不超过 20MB
- 最小不低于 1MB
- 通常为剩余空间的 5%

### 前端展示

学生在以下页面可以看到存储空间使用情况：
- 文档管理页面
- 开题报告页面

显示内容包括：
- 已用空间 / 总空间（10GB）
- 使用百分比进度条
- 当前状态提示
- 最大允许上传文件大小

## API 接口

### 获取存储使用统计

```
GET /api/storage/usage
```

响应示例：

```json
{
  "code": 200,
  "data": {
    "enabled": true,
    "storage": {
      "used": 1073741824,
      "usedFormatted": "1 GB",
      "limit": 10737418240,
      "limitFormatted": "10 GB",
      "usagePercent": "10.00"
    },
    "objects": {
      "count": 25
    },
    "status": "normal",
    "uploadAllowed": true,
    "maxFileSize": 524288000,
    "maxFileSizeFormatted": "500 MB"
  }
}
```

## 注意事项

1. **定期检查**：建议管理员定期检查存储使用情况
2. **清理旧文件**：可以实施定期清理策略，删除过期或不必要的文件
3. **文件压缩**：鼓励用户上传压缩后的文件以节省空间
4. **备份重要文件**：建议在本地或其他存储服务备份重要文件

## 故障排除

### 问题：上传失败，提示"R2 存储未配置"

**解决方案**：
1. 确认已在 Cloudflare Dashboard 创建 R2 存储桶
2. 检查 `wrangler.toml` 中的配置是否正确
3. 重新部署后端服务

### 问题：上传被拒绝，提示"存储空间不足"

**解决方案**：
1. 查看存储使用统计，确认使用率是否超过 95%
2. 联系管理员清理不必要的文件
3. 考虑升级到付费套餐

### 问题：无法获取存储统计信息

**解决方案**：
1. 检查网络连接
2. 确认用户已登录
3. 查看浏览器控制台错误信息

## 高级配置（可选）

### 添加 KV 存储跟踪操作次数

如果需要精确跟踪 R2 操作次数，可以添加 KV 命名空间：

1. 创建 KV 命名空间：
```bash
npx wrangler kv:namespace create R2_OPS
```

2. 更新 `wrangler.toml`：
```toml
[[kv_namespaces]]
binding = "KV"
id = "your-kv-namespace-id"
```

3. 系统会自动记录每次 R2 操作到 KV 存储

### 实施文件清理策略

可以在 `backend-workers/src/routes/storage.js` 中实现自动清理逻辑：

```javascript
// 示例：删除超过 90 天的文件
const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
const listed = await env.FILES.list();
for (const object of listed.objects) {
  if (new Date(object.uploaded) < ninetyDaysAgo) {
    await env.FILES.delete(object.key);
  }
}
```

## 技术支持

如有问题，请查看：
- Cloudflare R2 文档：https://developers.cloudflare.com/r2/
- Wrangler 文档：https://developers.cloudflare.com/workers/wrangler/
