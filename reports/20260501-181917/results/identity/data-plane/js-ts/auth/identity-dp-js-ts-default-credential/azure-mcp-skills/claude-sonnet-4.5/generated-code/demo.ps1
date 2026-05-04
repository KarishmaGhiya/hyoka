#!/usr/bin/env pwsh
# Demo script showing usage without actual Azure resources

Write-Host "=== Azure Key Vault Authentication Demo ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "This demo shows how the program handles missing configuration:" -ForegroundColor Yellow
Write-Host ""

# Test 1: Missing KEY_VAULT_URL
Write-Host "[Test 1] Running without KEY_VAULT_URL..." -ForegroundColor Green
npm start
Write-Host ""

# Test 2: With KEY_VAULT_URL but no authentication
Write-Host "[Test 2] Running with KEY_VAULT_URL but no credentials..." -ForegroundColor Green
Write-Host "(This would fail with authentication error if Azure CLI is not logged in)" -ForegroundColor Gray
$env:KEY_VAULT_URL = "https://my-demo-vault.vault.azure.net"
$env:SECRET_NAME = "demo-secret"
Write-Host ""
Write-Host "To run with actual Azure resources:" -ForegroundColor Cyan
Write-Host "  1. Create an Azure Key Vault" -ForegroundColor White
Write-Host "  2. Add a secret to the vault" -ForegroundColor White
Write-Host "  3. Run: az login" -ForegroundColor White
Write-Host "  4. Set environment variables:" -ForegroundColor White
Write-Host "       `$env:KEY_VAULT_URL = 'https://your-vault.vault.azure.net'" -ForegroundColor White
Write-Host "       `$env:SECRET_NAME = 'your-secret-name'" -ForegroundColor White
Write-Host "  5. Run: npm start" -ForegroundColor White
Write-Host ""
