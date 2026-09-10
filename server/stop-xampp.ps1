$xamppHome = 'C:\xampp'
$mysqlStop = Join-Path $xamppHome 'mysql_stop.bat'

if (-not (Test-Path $mysqlStop)) {
  throw "XAMPP MySQL stop script was not found at $mysqlStop."
}

Start-Process -FilePath $mysqlStop -WorkingDirectory $xamppHome -WindowStyle Hidden
Write-Host 'XAMPP MySQL stop requested.'