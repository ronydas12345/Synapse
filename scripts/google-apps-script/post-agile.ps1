param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('ping', 'summary', 'setSprint', 'upsertBacklog', 'upsertTask', 'upsertBug')]
  [string]$Action,

  [string]$RowFile,
  [string]$Url,
  [string]$Token
)

$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$envFile = Join-Path $root '.env'
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
    $pair = $_ -split '=', 2
    $name = $pair[0].Trim()
    $val = $pair[1].Trim().Trim('"').Trim("'")
    if ($name -and -not [Environment]::GetEnvironmentVariable($name)) {
      [Environment]::SetEnvironmentVariable($name, $val, 'Process')
    }
  }
}

if (-not $Url) { $Url = $env:SYNAPSE_AGILE_WEBHOOK_URL }
if (-not $Token) { $Token = $env:SYNAPSE_AGILE_WEBHOOK_TOKEN }
if (-not $Url -or -not $Token) {
  throw 'Set SYNAPSE_AGILE_WEBHOOK_URL and SYNAPSE_AGILE_WEBHOOK_TOKEN (or pass -Url / -Token).'
}

$row = @{}
if ($RowFile) {
  $row = Get-Content -Raw -Path $RowFile | ConvertFrom-Json
}

$body = @{
  token  = $Token
  action = $Action
  row    = $row
} | ConvertTo-Json -Depth 8 -Compress

$resp = Invoke-RestMethod -Method Post -Uri $Url -ContentType 'application/json; charset=utf-8' -Body $body
$resp | ConvertTo-Json -Depth 12
