# 毕业设计过程管理系统

基于Vue 3 + Express + MySQL的毕业设计过程管理系统。

## 技术栈

- 前端：Vue 3 + Element Plus + ECharts
- 后端：Express + MySQL + JWT认证
- 文件上传：Multer

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

### 1. 安装依赖

```bash
# 后端依赖
cd backend
npm install

# 前端依赖
cd frontend
npm install
```

### 2. 数据库配置

修改 `backend/config/default.json`:

```json
{
  "db": {
    "host": "localhost",
    "user": "root",
    "password": "your_password",
    "database": "graduation_management"
  }
}
```

确保MySQL运行并创建数据库：

```sql
CREATE DATABASE IF NOT EXISTS graduation_management;
```

### 3. 启动项目

```bash
# 启动后端 (端口3000)
cd backend
npm start

# 启动前端 (端口5173)
cd frontend
npm run dev
```

### 4. 访问系统

- 前端：http://localhost:5173
- 默认管理员账户：admin / admin123

## 功能模块

| 模块 | 说明 |
|------|------|
| 认证模块 | 登录、登出、密码修改 |
| 用户管理 | 学生/导师/管理员CRUD |
| 选题管理 | 发布、申请、审核课题 |
| 开题管理 | 开题报告提交、评阅 |
| 中期检查 | 进度填报、检查评分 |
| 文档管理 | 论文上传、版本管理 |
| 通知中心 | 消息推送、已读标记 |
| 统计报表 | 进度统计、成绩分布 |

## 用户角色

- **学生**：提交申请、上传文档、查看进度
- **导师**：发布课题、审核学生、评阅文档
- **管理员**：用户管理、系统配置、统计报表