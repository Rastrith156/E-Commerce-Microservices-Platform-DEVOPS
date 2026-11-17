$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$projectName = 'ecommerce-order-persistence-' + [guid]::NewGuid().ToString('N').Substring(0, 10)
$catalogImage = "$projectName/catalog-service:verification"
$orderImage = "$projectName/order-service:verification"
$workRoot = Join-Path $env:TEMP $projectName
$mavenRoot = Join-Path $env:TEMP ($projectName + '-m2')
$buildRoot = Join-Path $workRoot 'maven-project'
$imageRoot = Join-Path $workRoot 'runtime-image'
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$passwordBytes = New-Object byte[] 32
$rng.GetBytes($passwordBytes)
$password = ([BitConverter]::ToString($passwordBytes) -replace '-', '').ToLowerInvariant()
$rng.Dispose()

$savedEnvironment = @{}
foreach ($name in @('COMPOSE_PROJECT_NAME', 'ORDER_DB_NAME', 'ORDER_DB_USER', 'ORDER_DB_PASSWORD', 'CATALOG_HOST_PORT', 'ORDER_HOST_PORT', 'CATALOG_IMAGE', 'ORDER_IMAGE')) {
  $savedEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}
$orderImageCreated = $false
$catalogImageCreated = $false

function Get-FreePort {
  $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
  $listener.Start()
  try { return ([System.Net.IPEndPoint]$listener.LocalEndpoint).Port }
  finally { $listener.Stop() }
}

function Wait-Healthy([string]$service, [int]$timeoutSeconds = 180) {
  $deadline = (Get-Date).AddSeconds($timeoutSeconds)
  do {
    $containerId = & docker compose --project-name $projectName ps --quiet $service
    if ($LASTEXITCODE -eq 0 -and $containerId) {
      $health = & docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' $containerId
      if ($LASTEXITCODE -eq 0 -and $health.Trim() -eq 'healthy') { return }
    }
    Start-Sleep -Seconds 2
  } while ((Get-Date) -lt $deadline)
  throw "Timed out waiting for Compose service '$service' to become healthy."
}

function Wait-OrderApi([string]$baseUrl, [string]$recordId = $null, [int]$timeoutSeconds = 180) {
  $deadline = (Get-Date).AddSeconds($timeoutSeconds)
  do {
    try {
      if ($recordId) { return Invoke-RestMethod -Uri "$baseUrl/api/orders/$recordId" -TimeoutSec 5 }
      return Invoke-RestMethod -Uri "$baseUrl/actuator/health" -TimeoutSec 5
    } catch { Start-Sleep -Seconds 2 }
  } while ((Get-Date) -lt $deadline)
  throw 'Timed out waiting for the order API.'
}

Push-Location $repoRoot
try {
  $existingVolumes = & docker volume ls --format '{{.Name}}'
  if ($LASTEXITCODE -ne 0) { throw 'Could not inspect Docker volume names.' }
  $expectedVolume = "${projectName}_ecommerce_orders_data"
  if ($existingVolumes -contains $expectedVolume) { throw "Refusing to use an existing database volume: $expectedVolume" }

  $existingImages = & docker images --format '{{.Repository}}:{{.Tag}}'
  if ($LASTEXITCODE -ne 0) { throw 'Could not inspect Docker image tags.' }
  if ($existingImages -contains $catalogImage -or $existingImages -contains $orderImage) {
    throw "Refusing to overwrite a test image tag that already exists for project $projectName."
  }

  New-Item -ItemType Directory -Path $buildRoot,$mavenRoot,$imageRoot | Out-Null
  Copy-Item -LiteralPath (Join-Path $repoRoot 'services\order-service\pom.xml') -Destination $buildRoot
  Copy-Item -LiteralPath (Join-Path $repoRoot 'services\order-service\src') -Destination $buildRoot -Recurse
  & docker run --rm -v "${buildRoot}:/workspace" -v "${mavenRoot}:/root/.m2" `
    -w /workspace maven:3.9.9-eclipse-temurin-21-alpine mvn -B -ntp -C verify
  if ($LASTEXITCODE -ne 0) { throw 'Order service Maven verification failed.' }

  Copy-Item -LiteralPath (Join-Path $buildRoot 'target\order-service-1.0.0.jar') `
    -Destination (Join-Path $imageRoot 'app.jar')
  @'
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S -g 10001 app \
    && adduser -S -D -H -u 10001 -G app app \
    && mkdir /app \
    && chown app:app /app
WORKDIR /app
COPY --chown=10001:10001 app.jar /app/app.jar
USER 10001:10001
EXPOSE 8083
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-Djava.io.tmpdir=/tmp", "-jar", "/app/app.jar"]
'@ | Set-Content -LiteralPath (Join-Path $imageRoot 'Dockerfile') -Encoding ascii
  & docker build --tag $orderImage $imageRoot
  if ($LASTEXITCODE -ne 0) { throw 'Could not build the isolated order-service runtime image.' }
  $orderImageCreated = $true

  $env:COMPOSE_PROJECT_NAME = $projectName
  $env:ORDER_DB_NAME = 'ecommerce_orders'
  $env:ORDER_DB_USER = 'ecommerce_app'
  $env:ORDER_DB_PASSWORD = $password
  $env:CATALOG_HOST_PORT = [string](Get-FreePort)
  $env:ORDER_HOST_PORT = [string](Get-FreePort)
  $env:CATALOG_IMAGE = $catalogImage
  $env:ORDER_IMAGE = $orderImage

  & docker compose --project-name $projectName build catalog-service
  if ($LASTEXITCODE -ne 0) { throw 'Could not build the catalog image for the isolated test project.' }
  $catalogImageCreated = $true
  & docker compose --project-name $projectName up --detach --no-build order-db catalog-service order-service
  if ($LASTEXITCODE -ne 0) { throw 'Compose failed to start the isolated persistence test services.' }

  Wait-Healthy 'order-db'
  Wait-Healthy 'order-service'
  $baseUrl = "http://127.0.0.1:$env:ORDER_HOST_PORT"
  $payload = @{
    customerReference = 'persistence-test'
    items = @(@{ productId = 'chair-form'; quantity = 1 })
  } | ConvertTo-Json -Depth 6
  $created = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/payments/paypal/orders" `
    -ContentType 'application/json' -Body $payload
  if (-not $created.recordId -or -not $created.orderId) { throw 'Order creation did not return the durable record and payment IDs.' }
  $recordId = [string]$created.recordId
  $initial = Wait-OrderApi $baseUrl $recordId
  if ($initial.customerReference -ne 'persistence-test') { throw 'Initial order retrieval did not match the created order.' }
  Write-Output "VERIFIED: created and retrieved order $recordId"

  & docker compose --project-name $projectName restart order-service
  if ($LASTEXITCODE -ne 0) { throw 'Order service restart failed.' }
  Wait-Healthy 'order-service'
  $afterServiceRestart = Wait-OrderApi $baseUrl $recordId
  if ($afterServiceRestart.orderId -ne $created.orderId) { throw 'Order was not available after order-service restart.' }
  Write-Output 'VERIFIED: order survived order-service restart'

  & docker compose --project-name $projectName restart order-db
  if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL container restart failed.' }
  Wait-Healthy 'order-db'
  $afterDatabaseRestart = Wait-OrderApi $baseUrl $recordId
  if ($afterDatabaseRestart.orderId -ne $created.orderId) { throw 'Order was not available after PostgreSQL restart.' }
  Write-Output 'VERIFIED: order survived PostgreSQL container restart'

  & docker compose --project-name $projectName up --detach --force-recreate order-service
  if ($LASTEXITCODE -ne 0) { throw 'Order service recreation failed.' }
  Wait-Healthy 'order-service'
  $afterRecreation = Wait-OrderApi $baseUrl $recordId
  if ($afterRecreation.orderId -ne $created.orderId) { throw 'Order was not available after application container recreation.' }
  Write-Output 'VERIFIED: order survived order-service container recreation'
  Write-Output "Database volume retained: $expectedVolume"
}
finally {
  & docker compose --project-name $projectName down --remove-orphans
  if ($LASTEXITCODE -ne 0) { Write-Warning 'Could not remove the persistence test containers/network; the database volume was left untouched.' }
  if ($orderImageCreated) {
    & docker image rm $orderImage
    if ($LASTEXITCODE -ne 0) { Write-Warning "Could not remove the test order image tag: $orderImage" }
  }
  if ($catalogImageCreated) {
    & docker image rm $catalogImage
    if ($LASTEXITCODE -ne 0) { Write-Warning "Could not remove the test catalog image tag: $catalogImage" }
  }
  Pop-Location
  foreach ($name in $savedEnvironment.Keys) {
    [Environment]::SetEnvironmentVariable($name, $savedEnvironment[$name], 'Process')
  }
}
