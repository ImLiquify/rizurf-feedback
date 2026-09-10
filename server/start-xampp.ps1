$ErrorActionPreference = 'Stop'

$xamppHome = 'C:\xampp'
$projectRoot = Split-Path -Parent $PSScriptRoot
$mysqlStart = Join-Path $xamppHome 'mysql_start.bat'
$apacheStart = Join-Path $xamppHome 'apache_start.bat'

if (-not (Test-Path $mysqlStart)) {
  throw "XAMPP MySQL was not found at $mysqlStart."
}

if (-not (Test-Path $apacheStart)) {
  throw "XAMPP Apache was not found at $apacheStart."
}

if (-not (Get-Process mysqld,mariadbd -ErrorAction SilentlyContinue)) {
  Start-Process -FilePath $mysqlStart -WorkingDirectory $xamppHome -WindowStyle Hidden
}

if (-not (Get-Process httpd -ErrorAction SilentlyContinue)) {
  Start-Process -FilePath $apacheStart -WorkingDirectory $xamppHome -WindowStyle Hidden
}

$apiProcess = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
  Where-Object { $_.CommandLine -like '*server/rizurfApi.js*' }

if (-not $apiProcess) {
  Start-Process -FilePath 'npm.cmd' -ArgumentList 'run', 'dev:api' -WorkingDirectory $projectRoot
}

Write-Host 'XAMPP MySQL, Apache, and the PulseFeedback API are starting.'
Write-Host 'Open http://localhost/PulseFeedback/ after Apache is ready.'
