[CmdletBinding()]
param(
    [int]$Port = 8123
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$sourceDir = Join-Path $repoRoot 'js\memchat\src'

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    throw 'Python не найден в PATH. Установи Python или добавь его в PATH.'
}

Write-Host "Memchat DEV server" -ForegroundColor Cyan
Write-Host "Source: $sourceDir"
Write-Host "URL:    http://127.0.0.1:$Port/"
Write-Host ''
Write-Host 'Установи в Tampermonkey:' -ForegroundColor Yellow
Write-Host (Join-Path $repoRoot 'js\memchat\dev\memchat.dev.user.js')
Write-Host 'Для остановки нажми Ctrl+C.' -ForegroundColor DarkGray
Write-Host ''

Push-Location $sourceDir
try {
    & python -m http.server $Port --bind 127.0.0.1
    if ($LASTEXITCODE -ne 0) {
        throw "DEV-сервер завершился с кодом $LASTEXITCODE."
    }
}
finally {
    Pop-Location
}
