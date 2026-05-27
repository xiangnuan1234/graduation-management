# 数据库迁移说明

## 问题修复总结

本次修复解决了以下问题：

### 1. 500 错误 - 老师查看学生开题报告文件失败
**原因**: `proposal` 和 `document` 表缺少 `file_data` 字段，但代码尝试访问它。

**修复**:
- 在 `proposal` 表中添加 `file_data TEXT` 字段
- 在 `document` 表中添加 `file_data TEXT` 字段
- 更新文件获取逻辑，支持 R2 存储和数据库 Base64 存储两种方式

### 2. 403 错误 - 统计报表无法访问
**原因**: statistics API 只允许 admin 角色访问，但 teacher 和 student 也需要查看统计数据。

**修复**: 移除所有 statistics API 端点的角色限制，改为只需要登录即可访问。

### 3. 401 错误 - 通知中心认证失败
**原因**: 
- Token 过期或无效时没有友好的错误提示
- Layout 组件加载未读通知数时出错会影响用户体验

**修复**:
- 在 request.js 中添加完善的错误处理和用户提示
- 在 Layout.vue 中添加 try-catch 静默处理错误
- 优化 401/403/500 等错误的用户提示

### 4. 学生端论文上传功能
**状态**: 已存在，Documents.vue 中已有完整的上传功能（第51-76行）。

## 数据库迁移步骤

### 方法一：使用迁移脚本（推荐）

如果你使用的是 Cloudflare D1 数据库，执行以下 SQL 命令：

```sql
-- 为 proposal 表添加 file_data 字段
ALTER TABLE proposal ADD COLUMN file_data TEXT;

-- 为 document 表添加 file_data 字段
ALTER TABLE document ADD COLUMN file_data TEXT;
```

### 方法二：使用提供的迁移文件

迁移文件位置：
- `backend-workers/migrations/add_file_data_to_proposal.sql`
- `backend-workers/migrations/add_file_data_to_document.sql`

执行命令（根据你的 D1 数据库配置）：
```bash
wrangler d1 execute <YOUR_DB_NAME> --file=backend-workers/migrations/add_file_data_to_proposal.sql
wrangler d1 execute <YOUR_DB_NAME> --file=backend-workers/migrations/add_file_data_to_document.sql
```

### 方法三：重新创建数据库（仅开发环境）

如果是开发环境且可以清空数据，可以删除旧数据库并重新导入 schema：

```bash
# 删除旧数据库
rm -f .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*

# 重新导入 schema
wrangler d1 execute <YOUR_DB_NAME> --file=backend-workers/migrations/schema.sql
```

## 部署步骤

### 1. 应用数据库迁移

选择上述任一方法执行数据库迁移。

### 2. 部署后端 Workers

```bash
cd backend-workers
npm run deploy
```

或者使用 wrangler:
```bash
cd backend-workers
wrangler deploy
```

### 3. 部署前端 Pages

```bash
cd frontend
npm run build
wrangler pages deploy dist
```

## 验证修复

部署完成后，测试以下功能：

1. **老师查看学生开题报告文件**
   - 以老师身份登录
   - 进入"开题报告"页面
   - 点击"查看文件"按钮
   - 应该能成功下载文件

2. **统计报表访问**
   - 以 teacher 或 student 身份登录
   - 进入"统计报表"页面（teacher 可见）
   - 应该能看到统计数据，不再出现 403 错误

3. **通知中心**
   - 登录后检查通知中心
   - 如果 token 过期，应该看到友好的"登录已过期，请重新登录"提示
   - 自动跳转到登录页面

4. **学生上传论文**
   - 以学生身份登录
   - 进入"文档管理"页面
   - 点击"上传文档"按钮
   - 选择文件并提交
   - 应该能成功上传

## 注意事项

1. **file_data 字段用途**: 
   - 当 R2 存储未配置时，文件会以 Base64 格式存储在 `file_data` 字段中
   - 当 R2 存储已配置时，文件存储在 R2，`file_data` 为 NULL
   - 代码会自动判断使用哪种方式

2. **文件大小限制**:
   - R2 存储：根据额度动态调整（最大 100MB）
   - 数据库存储：最大 5MB（Base64 编码后约为原大小的 1.33 倍）

3. **向后兼容**:
   - 旧的记录如果没有 `file_data` 字段也能正常工作
   - 新上传的文件会根据配置选择存储方式

## 常见问题

### Q: 迁移时提示 "column already exists"
A: 这说明字段已经存在，可以忽略该错误继续执行下一个迁移。

### Q: 部署后仍然出现 500 错误
A: 请确认：
   1. 数据库迁移已成功执行
   2. Workers 已重新部署
   3. 清除浏览器缓存后重试

### Q: 学生看不到"统计报表"菜单
A: 这是正常的，statistics 菜单只对 admin 和 teacher 可见（Layout.vue 第47行）。但 student 可以通过 API 访问统计数据。
