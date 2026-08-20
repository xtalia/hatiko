[CmdletBinding()]
param(
    [string]$Message = 'refactor: update memchat',
    [switch]$SkipPush
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path

function Invoke-Native([string]$File, [string[]]$Arguments) {
    Write-Host "> $File $($Arguments -join ' ')" -ForegroundColor DarkGray
    & $File @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$File завершился с кодом $LASTEXITCODE."
    }
}

Push-Location $repoRoot
try {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw 'Node.js не найден в PATH.'
    }
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw 'Git не найден в PATH.'
    }

    Write-Host '1/5 Сборка production userscript...' -ForegroundColor Cyan
    Invoke-Native 'node' @('js/memchat/build-memchat.js')

    Write-Host '2/5 Проверка production userscript...' -ForegroundColor Cyan
    Invoke-Native 'node' @('--check', 'js/memchat.user.js')

    Write-Host '3/5 Проверка исходных модулей...' -ForegroundColor Cyan
    Get-ChildItem 'js/memchat/src' -Filter '*.js' | Sort-Object Name | ForEach-Object {
        Invoke-Native 'node' @('--check', $_.FullName)
    }
    Invoke-Native 'node' @('--check', 'js/memchat/build-memchat.js')
    Invoke-Native 'node' @('--check', 'js/memchat/dev/memchat.dev.user.js')

    Write-Host '4/5 Проверка git diff...' -ForegroundColor Cyan
    Invoke-Native 'git' @('diff', '--check')
    Invoke-Native 'git' @('status', '--short')

    Write-Host '5/5 Commit...' -ForegroundColor Cyan
    Invoke-Native 'git' @('add', 'README.md', 'js/memchat.user.js', 'js/memchat')

    $staged = git diff --cached --name-only
    if (-not $staged) {
        Write-Host 'Изменений для commit нет.' -ForegroundColor Yellow
        return
    }

    Invoke-Native 'git' @('commit', '-m', $Message)

    if (-not $SkipPush) {
        Write-Host 'Push в origin/main...' -ForegroundColor Cyan
        Invoke-Native 'git' @('push', 'origin', 'main')
    }

    Write-Host ''
    Write-Host 'Публикация завершена.' -ForegroundColor Green
    Invoke-Native 'git' @('status', '--short')
    Invoke-Native 'git' @('log', '-1', '--oneline')
}
finally {
    Pop-Location
}
