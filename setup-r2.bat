@echo off
chcp 65001 >nul
echo ========================================
echo R2 文件上传功能配置和部署脚本
echo ========================================
echo.

cd backend-workers

echo [步骤 1] 检查 wrangler 登录状态...
npx wrangler whoami
if errorlevel 1 (
    echo.
    echo 请先登录 Cloudflare！
    npx wrangler login
)

echo.
echo [步骤 2] 创建 R2 存储桶...
echo 如果存储桶已存在，会显示错误信息，可以忽略
npx wrangler r2 bucket create graduation-files

echo.
echo [步骤 3] 验证配置文件...
echo 检查 wrangler.toml 中的 R2 配置...
findstr /C:"[[r2_buckets]]" wrangler.toml >nul
if errorlevel 1 (
    echo 警告: wrangler.toml 中未找到 R2 配置！
    echo 请手动添加以下配置到 wrangler.toml:
    echo.
    echo [[r2_buckets]]
    echo binding = "FILES"
    echo bucket_name = "graduation-files"
    echo.
    pause
    exit /b 1
) else (
    echo ✓ R2 配置已存在
)

echo.
echo [步骤 4] 部署后端服务...
echo 这可能需要几分钟时间...
npm run deploy

if errorlevel 1 (
    echo.
    echo ✗ 部署失败！请检查错误信息。
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✓ 部署成功！
echo ========================================
echo.
echo 接下来：
echo 1. 访问你的前端应用
echo 2. 登录学生账号
echo 3. 进入"文档管理"或"开题报告"页面
echo 4. 查看存储空间使用情况
echo 5. 尝试上传文件测试功能
echo.
echo 详细说明请查看 R2_SETUP.md 文件
echo.
pause
