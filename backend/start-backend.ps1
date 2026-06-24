# Load local PostgreSQL settings then start Spring Boot
$envFile = Join-Path $PSScriptRoot "local.env"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -notmatch '^\s*([^#=]+)=(.*)$') { return }
    $name = $matches[1].Trim()
    $value = $matches[2].Trim()
    Set-Item -Path "env:$name" -Value $value
  }
  Write-Host "Loaded $envFile"
} else {
  Write-Host "No local.env found - using application.properties defaults."
}

Set-Location $PSScriptRoot
mvn spring-boot:run
