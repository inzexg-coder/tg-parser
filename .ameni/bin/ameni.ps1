<#
.SYNOPSIS
  Ameni TG Parser - Telegram chat analyzer (cross-platform).

.DESCRIPTION
  Commands:
    stats <file>     Full chat statistics
    top <file>       Top message senders
    activity <file>  Activity by hour and weekday
    media <file>     Media type distribution
    about            Display agent information
    help             Show detailed help
#>

param(
  [string]$Command = "help",
  [string]$Argument = ""
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$LibPath = Resolve-Path "$ScriptDir/../lib/telegram.js"

function Require-Node {
  $node = Get-Command node -ErrorAction SilentlyContinue
  if (-not $node) {
    Write-Host "[ERROR] Node.js is required." -ForegroundColor Red
    Write-Host "  Install: winget install OpenJS.NodeJS"
    Write-Host "  Or download from https://nodejs.org"
    exit 1
  }
}

function Cmd-Stats {
  param([string]$File)
  if (-not $File) {
    Write-Host "[ERROR] Usage: ameni tg stats <result.json>" -ForegroundColor Red
    exit 2
  }
  if (-not (Test-Path $File)) {
    Write-Host "[ERROR] File not found: $File" -ForegroundColor Red
    exit 1
  }
  Require-Node
  Write-Host "[INFO]  File: $File" -ForegroundColor Green
  Write-Host ""
  & node $LibPath $File stats
}

function Cmd-Top {
  param([string]$File)
  if (-not $File) {
    Write-Host "[ERROR] Usage: ameni tg top <result.json>" -ForegroundColor Red
    exit 2
  }
  if (-not (Test-Path $File)) {
    Write-Host "[ERROR] File not found: $File" -ForegroundColor Red
    exit 1
  }
  Require-Node
  Write-Host "[INFO]  File: $File" -ForegroundColor Green
  & node $LibPath $File top
}

function Cmd-Activity {
  param([string]$File)
  if (-not $File) {
    Write-Host "[ERROR] Usage: ameni tg activity <result.json>" -ForegroundColor Red
    exit 2
  }
  if (-not (Test-Path $File)) {
    Write-Host "[ERROR] File not found: $File" -ForegroundColor Red
    exit 1
  }
  Require-Node
  Write-Host "[INFO]  File: $File" -ForegroundColor Green
  & node $LibPath $File activity
}

function Cmd-Media {
  param([string]$File)
  if (-not $File) {
    Write-Host "[ERROR] Usage: ameni tg media <result.json>" -ForegroundColor Red
    exit 2
  }
  if (-not (Test-Path $File)) {
    Write-Host "[ERROR] File not found: $File" -ForegroundColor Red
    exit 1
  }
  Require-Node
  Write-Host "[INFO]  File: $File" -ForegroundColor Green
  & node $LibPath $File media
}

function Cmd-About {
  Write-Host ""
  Write-Host "Ameni TG Parser"
  Write-Host "Telegram Chat Analyzer"
  Write-Host "https://github.com/inzexg-coder/ameni-tg-parser"
  Write-Host ""
  Write-Host "Platforms: Windows, Arch Linux, macOS"
  Write-Host ""
  Write-Host "Commands:"
  Write-Host "  stats <file>     Full chat statistics"
  Write-Host "  top <file>       Top message senders"
  Write-Host "  activity <file>  Activity by hour and weekday"
  Write-Host "  media <file>     Media type distribution"
  Write-Host "  about            Display this information"
  Write-Host "  help             Show detailed help"
  Write-Host ""
  Write-Host "Arch Linux:"
  Write-Host "  sudo pacman -S nodejs npm"
  Write-Host ""
  Write-Host "Windows:"
  Write-Host "  winget install OpenJS.NodeJS"
  Write-Host "  Then run from PowerShell or Git Bash"
  Write-Host ""
}

function Cmd-Help {
  Write-Host ""
  Write-Host "NAME"
  Write-Host "  ameni tg - Telegram Chat Analyzer Agent (cross-platform)"
  Write-Host ""
  Write-Host "SYNOPSIS"
  Write-Host "  ameni tg stats <file>"
  Write-Host "  ameni tg top <file>"
  Write-Host "  ameni tg activity <file>"
  Write-Host "  ameni tg media <file>"
  Write-Host ""
  Write-Host "COMMANDS"
  Write-Host ""
  Write-Host "  stats <file>"
  Write-Host "    Full chat statistics: message count, participants,"
  Write-Host "    date range, average length, top senders, media."
  Write-Host ""
  Write-Host "  top <file>"
  Write-Host "    Top 10 message senders with bar chart."
  Write-Host ""
  Write-Host "  activity <file>"
  Write-Host "    Message distribution by hour of day and weekday."
  Write-Host ""
  Write-Host "  media <file>"
  Write-Host "    Media distribution: photos, videos, stickers, GIFs."
  Write-Host ""
  Write-Host "REQUIREMENTS"
  Write-Host "  Windows:     winget install OpenJS.NodeJS"
  Write-Host "  Arch Linux:  pacman -S nodejs npm"
  Write-Host "  All:         Node.js 14+"
  Write-Host ""
  Write-Host "REFERENCE"
  Write-Host "  https://github.com/inzexg-coder/ameni-tg-parser"
  Write-Host ""
}

switch ($Command) {
  "stats"    { Cmd-Stats $Argument }
  "top"      { Cmd-Top $Argument }
  "activity" { Cmd-Activity $Argument }
  "media"    { Cmd-Media $Argument }
  "about"    { Cmd-About }
  "help"     { Cmd-Help }
  default    { Cmd-Help }
}
