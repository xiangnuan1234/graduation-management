# R2 文件上传功能配置和部署脚本 (PowerShell)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "R2 文件上传功能配置和部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location backend-workers

# 步骤 1: 检查 wrangler 登录状态
Write-Host "[步骤 1] 检查 wrangler 登录状态..." -ForegroundColor Yellow
try {
    npx wrangler whoami
} catch {
    Write-Host ""
    Write-Host "请先登录 Cloudflare！" -ForegroundColor Red
    npx wrangler login
}

# 步骤 2: 创建 R2 存储桶
Write-Host ""
Write-Host "[步骤 2] 创建 R2 存储桶..." -ForegroundColor Yellow
Write-Host "如果存储桶已存在，会显示错误信息，可以忽略" -ForegroundColor Gray
try {
    npx wrangler r2 bucket create graduation-files 2>&1 | Out-Null
    Write-Host "✓ R2 存储桶创建成功或已存在" -ForegroundColor Green
} catch {
    Write-Host "⚠ 创建存储桶时出现警告（可能已存在）" -ForegroundColor Yellow
}

# 步骤 3: 验证配置文件
Write-Host ""
Write-Host "[步骤 3] 验证配置文件..." -ForegroundColor Yellow
$wranglerContent = Get-Content wrangler.toml -Raw
if ($wranglerContent -match '\[\[r2_buckets\]\]') {
    Write-Host "✓ R2 配置已存在于 wrangler.toml" -ForegroundColor Green
} else {
    Write-Host "✗ 警告: wrangler.toml 中未找到 R2 配置！" -ForegroundColor Red
    Write-Host ""
    Write-Host "请手动添加以下配置到 wrangler.toml:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "[[r2_buckets]]" -ForegroundColor White
    Write-Host "binding = `"FILES`"" -ForegroundColor White
    Write-Host "bucket_name = `"graduation-files`"" -ForegroundColor White
    Write-Host ""
    Read-Host "按回车键退出"
    exit 1
}

# 步骤 4: 部署后端服务
Write-Host ""
Write-Host "[步骤 4] 部署后端服务..." -ForegroundColor Yellow
Write-Host "这可能需要几分钟时间..." -ForegroundColor Gray
try {
    npm run deploy
    if ($LASTEXITCODE -ne 0) {
        throw "部署失败"
    }
} catch {
    Write-Host ""
    Write-Host "✗ 部署失败！请检查错误信息。" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ 部署成功！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "接下来：" -ForegroundColor Cyan
Write-Host "1. 访问你的前端应用" -ForegroundColor White
Write-Host "2. 登录学生账号" -ForegroundColor White
Write-Host "3. 进入'文档管理'或'开题报告'页面" -ForegroundColor White
Write-Host "4. 查看存储空间使用情况" -ForegroundColor White
Write-Host "5. 尝试上传文件测试功能" -ForegroundColor White
Write-Host ""
Write-Host "详细说明请查看 R2_SETUP.md 文件" -ForegroundColor White
Write-Host ""

Read-Host "按回车键退出"
