# Downloads insurance-themed demo images and videos into frontend/public/evidence/
$ErrorActionPreference = "Continue"
$dir = Join-Path $PSScriptRoot "..\frontend\public\evidence"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

$headers = @{ "User-Agent" = "PrimeInsuranceEvidenceFetcher/1.0" }

function Save-RemoteFile($url, $outPath) {
  try {
    Invoke-WebRequest -Uri $url -OutFile $outPath -UseBasicParsing -Headers $headers -TimeoutSec 120
    return $true
  } catch {
    Write-Warning "Failed: $outPath - $($_.Exception.Message)"
    return $false
  }
}

# Pexels — free stock; themes match Prime Insurance claim types
$images = @{
  "auto-damage-front.jpg" = "https://images.pexels.com/photos/3802508/pexels-photo-3802508.jpeg?auto=compress&cs=tinysrgb&w=900"
  "auto-damage-side.jpg" = "https://images.pexels.com/photos/3802508/pexels-photo-3802508.jpeg?auto=compress&cs=tinysrgb&w=900"
  "auto-license-plate.jpg" = "https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=900"
  "auto-accident-scene.jpg" = "https://images.pexels.com/photos/241316/pexels-photo-241316.jpeg?auto=compress&cs=tinysrgb&w=900"
  "auto-scratch-closeup.jpg" = "https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg?auto=compress&cs=tinysrgb&w=900"
  "auto-parking-context.jpg" = "https://images.pexels.com/photos/112460/pexels-photo-112460.jpeg?auto=compress&cs=tinysrgb&w=900"
  "auto-total-loss.jpg" = "https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=900"
  "auto-engine-fire.jpg" = "https://images.pexels.com/photos/3720705/pexels-photo-3720705.jpeg?auto=compress&cs=tinysrgb&w=900"
  "health-hospital-ward.jpg" = "https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=900"
  "health-prescription.jpg" = "https://images.pexels.com/photos/3683098/pexels-photo-3683098.jpeg?auto=compress&cs=tinysrgb&w=900"
  "health-ultrasound.jpg" = "https://images.pexels.com/photos/7089025/pexels-photo-7089025.jpeg?auto=compress&cs=tinysrgb&w=900"
  "health-dental-xray.jpg" = "https://images.pexels.com/photos/3845657/pexels-photo-3845657.jpeg?auto=compress&cs=tinysrgb&w=900"
  "health-post-procedure.jpg" = "https://images.pexels.com/photos/7579831/pexels-photo-7579831.jpeg?auto=compress&cs=tinysrgb&w=900"
  "property-flood-living-room.jpg" = "https://images.pexels.com/photos/8061500/pexels-photo-8061500.jpeg?auto=compress&cs=tinysrgb&w=900"
  "property-water-damage.jpg" = "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=900"
  "property-roof-leak.jpg" = "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=900"
  "property-fire-damage.jpg" = "https://images.pexels.com/photos/1118448/pexels-photo-1118448.jpeg?auto=compress&cs=tinysrgb&w=900"
  "property-storm-wall.jpg" = "https://images.pexels.com/photos/1118448/pexels-photo-1118448.jpeg?auto=compress&cs=tinysrgb&w=900"
  "property-storm-yard.jpg" = "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=900"
  "property-broken-window.jpg" = "https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg?auto=compress&cs=tinysrgb&w=900"
  "billing-receipt.jpg" = "https://images.pexels.com/photos/6863332/pexels-photo-6863332.jpeg?auto=compress&cs=tinysrgb&w=900"
  "billing-pharmacy-receipt.jpg" = "https://images.pexels.com/photos/3683099/pexels-photo-3683099.jpeg?auto=compress&cs=tinysrgb&w=900"
  "identity-id-card.jpg" = "https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=900"
}

$videos = @{
  "video-dashcam-drive.mp4" = "https://assets.mixkit.co/videos/4488/4488-720.mp4"
  "video-property-walkthrough.mp4" = "https://assets.mixkit.co/videos/5077/5077-720.mp4"
  "video-clinic-tour.mp4" = "https://assets.mixkit.co/videos/4928/4928-720.mp4"
  "video-drone-site-survey.mp4" = "https://assets.mixkit.co/videos/1018/1018-720.mp4"
  "video-insurance-consultation.mp4" = "https://assets.mixkit.co/videos/4836/4836-720.mp4"
}

$authBg = Join-Path $PSScriptRoot "..\frontend\src\assets\auth-bg.png"
if (Test-Path $authBg) {
  Copy-Item $authBg (Join-Path $dir "prime-brand-backdrop.png") -Force
}

Write-Host "Downloading Prime Insurance demo images..."
$ok = 0
foreach ($entry in $images.GetEnumerator()) {
  $out = Join-Path $dir $entry.Key
  if (Save-RemoteFile $entry.Value $out) {
    $ok++
    Write-Host "  OK $($entry.Key)"
  }
}

Write-Host "Downloading demo videos..."
foreach ($entry in $videos.GetEnumerator()) {
  $out = Join-Path $dir $entry.Key
  if (Save-RemoteFile $entry.Value $out) {
    $ok++
    Write-Host "  OK $($entry.Key)"
  }
}

Write-Host "Finished. $ok files saved under $dir"
