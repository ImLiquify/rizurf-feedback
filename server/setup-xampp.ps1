$ErrorActionPreference = 'Stop'

$xamppHome = 'C:\xampp'
$mysqlBin = Join-Path $xamppHome 'mysql\bin'
$mysql = Join-Path $mysqlBin 'mysql.exe'
$mysqlStart = Join-Path $xamppHome 'mysql_start.bat'
$schemaFile = Join-Path $PSScriptRoot 'schema.sql'

if (-not (Test-Path $mysql) -or -not (Test-Path $mysqlStart)) {
  throw "XAMPP MySQL was not found at $xamppHome. Install XAMPP or update the xamppHome path in this script."
}

$mysqlProcess = Get-Process mysqld,mariadbd -ErrorAction SilentlyContinue
if (-not $mysqlProcess) {
  Start-Process -FilePath $mysqlStart -WorkingDirectory $xamppHome -WindowStyle Hidden
  Start-Sleep -Seconds 4
}

$databaseSql = Get-Content -Raw -Path $schemaFile
$databaseSql | & $mysql --protocol=tcp --host=127.0.0.1 --port=3306 --user=root --skip-password
if ($LASTEXITCODE -ne 0) {
  throw 'XAMPP MySQL did not accept the schema. Check that MySQL is running in the XAMPP Control Panel.'
}

Write-Host 'XAMPP MySQL is running on 127.0.0.1:3306.'
Write-Host 'Database: pulsefeedback'
Write-Host 'Application user: pulseuser / pulsepassword'