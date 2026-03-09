param(
  [Parameter(Mandatory = $true)]
  [string]$ExePath,
  [int]$Runs = 5,
  [int]$SampleSeconds = 10
)

if (!(Test-Path $ExePath)) {
  throw "Executable not found: $ExePath"
}

$results = @()

for ($i = 1; $i -le $Runs; $i++) {
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $process = Start-Process -FilePath $ExePath -PassThru
  Start-Sleep -Seconds $SampleSeconds
  $sw.Stop()

  $proc = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
  $alive = $null -ne $proc

  $results += [pscustomobject]@{
    run            = $i
    startup_sec    = [math]::Round($sw.Elapsed.TotalSeconds, 2)
    alive          = $alive
    working_set_mb = if ($alive) { [math]::Round($proc.WorkingSet64 / 1MB, 2) } else { 0 }
    cpu_sec        = if ($alive) { [math]::Round($proc.CPU, 2) } else { 0 }
  }

  if ($alive) {
    Stop-Process -Id $process.Id -Force
  }

  Start-Sleep -Milliseconds 800
}

$avgStartup = [math]::Round((($results | Measure-Object -Property startup_sec -Average).Average), 2)
$avgMemory = [math]::Round((($results | Measure-Object -Property working_set_mb -Average).Average), 2)
$allAlive = ($results | Where-Object { -not $_.alive }).Count -eq 0

$payload = [pscustomobject]@{
  generated_at_utc = (Get-Date).ToUniversalTime().ToString("o")
  exe_path         = $ExePath
  runs             = $Runs
  sample_seconds   = $SampleSeconds
  avg_startup_sec  = $avgStartup
  avg_memory_mb    = $avgMemory
  all_runs_alive   = $allAlive
  results          = $results
}

$outDir = "performance-results"
New-Item -ItemType Directory -Path $outDir -Force | Out-Null
$jsonPath = Join-Path $outDir "electron-benchmark.json"
$mdPath = Join-Path $outDir "electron-benchmark.md"

$payload | ConvertTo-Json -Depth 6 | Set-Content -Path $jsonPath -Encoding UTF8

$md = @"
# Electron Production Benchmark

- Executable: $ExePath
- Runs: $Runs
- Sample seconds per run: $SampleSeconds
- Average startup (s): $avgStartup
- Average memory (MB): $avgMemory
- All runs alive: $allAlive

| Run | Startup (s) | Memory (MB) | CPU (s) | Alive |
| --- | ---: | ---: | ---: | :---: |
"@

foreach ($r in $results) {
  $md += "`n| $($r.run) | $($r.startup_sec) | $($r.working_set_mb) | $($r.cpu_sec) | $($r.alive) |"
}

Set-Content -Path $mdPath -Value $md -Encoding UTF8

Write-Output "Benchmark report written to $jsonPath and $mdPath"
