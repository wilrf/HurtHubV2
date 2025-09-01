# GitHub Secrets Setup Script
# This script will help set up your GitHub secrets correctly

Write-Host "GitHub Secrets Configuration Script" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

# Install GitHub CLI if not present
Write-Host "`nChecking for GitHub CLI..." -ForegroundColor Yellow
$ghPath = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghPath) {
    Write-Host "GitHub CLI not found. Installing..." -ForegroundColor Yellow
    winget install --id GitHub.cli --accept-source-agreements --accept-package-agreements
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# Authenticate with GitHub
Write-Host "`nAuthenticating with GitHub..." -ForegroundColor Yellow
gh auth status
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please authenticate with GitHub:" -ForegroundColor Yellow
    gh auth login
}

# Set the secrets (no trailing newlines)
Write-Host "`nSetting GitHub Secrets..." -ForegroundColor Yellow

Write-Host "Setting VERCEL_TOKEN..." -ForegroundColor Cyan
echo "l2thPOcsi1y7hi4sli6lPnQc" | gh secret set VERCEL_TOKEN

Write-Host "Setting VERCEL_ORG_ID..." -ForegroundColor Cyan
echo "team_ZbqBeYDH5mbXA05FGuGU6GyP" | gh secret set VERCEL_ORG_ID

Write-Host "Setting VERCEL_PROJECT_ID..." -ForegroundColor Cyan
echo "prj_k8RU8XeCvQyYNkQwcVXX7vQcTBiu" | gh secret set VERCEL_PROJECT_ID

Write-Host "`n✅ All secrets have been set!" -ForegroundColor Green
Write-Host "You can now re-run your GitHub Actions workflow." -ForegroundColor Green