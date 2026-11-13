param([int]$Port = 4173)

$ErrorActionPreference = "Stop"
$publicRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "public"))
$server = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$server.Start()
Write-Host "Gyeongsan dashboard: http://127.0.0.1:$Port"

function Write-Response($stream, [byte[]]$body, [string]$contentType, [int]$status = 200) {
  $reason = if ($status -eq 200) { "OK" } else { "Error" }
  $head = "HTTP/1.1 $status $reason`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nConnection: close`r`nCache-Control: no-store`r`n`r`n"
  $headerBytes = [Text.Encoding]::ASCII.GetBytes($head)
  $stream.Write($headerBytes, 0, $headerBytes.Length)
  $stream.Write($body, 0, $body.Length)
  $stream.Flush()
}

function Write-Json($stream, $value) {
  $json = $value | ConvertTo-Json -Depth 15 -Compress
  Write-Response $stream ([Text.Encoding]::UTF8.GetBytes($json)) "application/json; charset=utf-8"
}

$mime = @{ ".html"="text/html; charset=utf-8"; ".css"="text/css; charset=utf-8"; ".js"="text/javascript; charset=utf-8"; ".svg"="image/svg+xml" }

try {
  while ($true) {
    $client = $server.AcceptTcpClient()
    $stream = $client.GetStream()
    try {
      $reader = [System.IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()
      while ($reader.ReadLine()) { }
      if (-not $requestLine) { continue }
      $requestTarget = ($requestLine -split " ")[1]
      $uri = [Uri]::new("http://127.0.0.1:$Port$requestTarget")
      if ($uri.AbsolutePath -eq "/api/status") {
        Write-Json $stream @{ dataGoKr=[bool]$env:DATA_GO_KR_API_KEY; reb=[bool]$env:REB_API_KEY; region="Gyeongsan-si"; lawdCode="47290" }
        continue
      }
      if ($uri.AbsolutePath -eq "/api/trades") {
        if (-not $env:DATA_GO_KR_API_KEY) {
          Write-Json $stream @{ mode="sample"; reason="API key is not configured"; items=@() }
          continue
        }
        $query = [System.Web.HttpUtility]::ParseQueryString($uri.Query)
        $type = $query["type"]
        $dealYmd = $query["dealYmd"]
        $dong = $query["dong"]
        $service = if ($type -eq "sale") { "RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev" } else { "RTMSDataSvcAptRent/getRTMSDataSvcAptRent" }
        $encodedKey = [Uri]::EscapeDataString($env:DATA_GO_KR_API_KEY)
        $apiUrl = "https://apis.data.go.kr/1613000/$service`?serviceKey=$encodedKey&LAWD_CD=47290&DEAL_YMD=$dealYmd&pageNo=1&numOfRows=500&resultType=json"
        try {
          $payload = Invoke-RestMethod -Uri $apiUrl -TimeoutSec 9 -Headers @{ Accept="application/json" }
          $items = @($payload.response.body.items.item)
          if ($dong -and $dong.Length -gt 2) {
            $stem = $dong.Substring(0, $dong.Length - 1)
            $items = @($items | Where-Object { ([string]$_.umdNm).Contains($stem) -or ([string]$_.UMD_NM).Contains($stem) })
          }
          Write-Json $stream @{ mode="live"; source="MOLIT real transaction API"; updatedAt=(Get-Date).ToString("o"); items=$items }
        } catch {
          Write-Json $stream @{ mode="sample"; reason=$_.Exception.Message; items=@() }
        }
        continue
      }
      $relative = [Uri]::UnescapeDataString($uri.AbsolutePath.TrimStart('/'))
      if (-not $relative) { $relative = "index.html" }
      $target = [System.IO.Path]::GetFullPath((Join-Path $publicRoot $relative))
      if (-not $target.StartsWith($publicRoot) -or -not (Test-Path -LiteralPath $target -PathType Leaf)) { $target = Join-Path $publicRoot "index.html" }
      $body = [System.IO.File]::ReadAllBytes($target)
      $ext = [System.IO.Path]::GetExtension($target).ToLowerInvariant()
      $contentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" }
      Write-Response $stream $body $contentType
    } catch {
      $body = [Text.Encoding]::UTF8.GetBytes($_.Exception.Message)
      Write-Response $stream $body "text/plain; charset=utf-8" 500
    } finally {
      $stream.Close()
      $client.Close()
    }
  }
} finally {
  $server.Stop()
}
