# 毕业设计过程管理系统

基于 Vue 3 + Cloudflare Workers + D1 + R2 的毕业设计过程管理系统。

## ✨ 最新特性

- 🚀 **Cloudflare 部署**：使用 Workers + Pages，无需服务器
- 💾 **R2 对象存储**：智能文件存储，自动额度监控
- 🛡️ **额度保护**：95% 阈值自动停止上传，避免超额费用
- 📊 **可视化统计**：实时显示存储空间使用情况
- 🔄 **自动部署**：GitHub Actions 一键部署

## 技术栈

### 前端
- Vue 3 + Vite
- Element Plus UI 组件库
- ECharts 数据可视化
- Pinia 状态管理

### 后端
- Cloudflare Workers（无服务器架构）
- Cloudflare D1（SQLite 数据库）
- Cloudflare R2（对象存储）
- JWT 身份认证

## 项目结构

```
├── frontend/          # 前端项目
│   ├── src/
│   │   ├── api/     # API接口
│   │   ├── views/   # 页面组件
│   │   ├── router/  # 路由配置
│   │   └── store/   # 状态管理
│   └── package.json
│
├── backend/         # 后端项目
│   ├── routes/     # API路由
│   ├── middleware/# 中间件
│   ├── config/    # 配置文件
│   ├── uploads/   # 上传文件目录
│   └── package.json
│
└── README.md
```

## 快速开始

### 方式一：Cloudflare 部署（推荐）

#### 1. 配置 GitHub Secrets

在 GitHub 仓库 Settings → Secrets → Actions 中添加：

- `CLOUDFLARE_API_TOKEN` - Cloudflare API Token
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare Account ID

详细配置指南：[GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)

#### 2. 推送代码触发自动部署

```bash
git add .
git commit -m "deploy: 初始部署"
git push origin master
```

GitHub Actions 会自动：
- ✅ 创建 R2 存储桶
- ✅ 部署后端 Workers
- ✅ 部署前端 Pages
- ✅ 配置域名和 CORS

#### 3. 访问系统

- 前端：你的 Cloudflare Pages 域名
- 默认管理员账户：admin / admin123

---

### 方式二：本地开发

#### 1. 安装依赖

```bash
# 后端依赖
cd backend-workers
npm install

# 前端依赖
cd frontend
npm install
```

#### 2. 配置环境变量

创建 `backend-workers/.dev.vars`：

```env
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
```

#### 3. 启动开发服务器

```bash
# 启动后端 Workers (端口 8787)
cd backend-workers
npm run dev

# 启动前端 (端口 5173)
cd frontend
npm run dev
```

#### 4. 访问系统

- 前端：http://localhost:5173
- 后端 API：http://localhost:8787

## 功能模块

| 模块 | 说明 |
|------|------|
| 🔐 认证模块 | 登录、登出、密码修改 |
| 👥 用户管理 | 学生/导师/管理员CRUD |
| 📝 选题管理 | 发布、申请、审核课题 |
| 📄 开题管理 | 开题报告提交、评阅 |
| 📊 中期检查 | 进度填报、检查评分 |
| 📁 文档管理 | 论文上传、版本管理、R2存储 |
| 🔔 通知中心 | 消息推送、已读标记 |
| 📈 统计报表 | 进度统计、成绩分布 |
| 💾 存储管理 | R2使用监控、额度保护 |

## R2 文件存储功能

### 核心特性

✅ **智能额度监控**：实时监控 R2 存储使用情况  
✅ **自动停止上传**：使用量达到 95% 时自动禁止上传  
✅ **动态文件大小限制**：根据剩余空间自动调整  
✅ **可视化展示**：前端显示存储使用进度条  
✅ **多级警告机制**：70% → 85% → 95% 逐级提醒  

### 免费额度

Cloudflare R2 提供免费套餐：
- 存储空间：10 GB/月
- A 类操作（写入）：100 万次/月
- B 类操作（读取）：1000 万次/月

### 保护机制

| 使用率 | 状态 | 行为 |
|--------|------|------|
| < 70% | ✅ 正常 | 允许上传，最大 20MB |
| 70%-85% | ⚠️ 注意 | 允许上传，显示提示 |
| 85%-95% | 🔶 警告 | 允许上传，限制文件大小 |
| ≥ 95% | 🚫 禁止 | **停止上传**，避免超额 |

详细文档：[README_R2.md](./README_R2.md) | [R2_SETUP.md](./R2_SETUP.md)

## 用户角色

- **学生**：提交申请、上传文档、查看进度
- **导师**：发布课题、审核学生、评阅文档
- **管理员**：用户管理、系统配置、统计报表