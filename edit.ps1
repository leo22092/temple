# Paths
$downloadDir = "$env:USERPROFILE\Downloads"
$target = "$env:USERPROFILE\temple\js\data.js"

# Open login page
Write-Host "🔐 Opening login page..."
Start-Process "$env:USERPROFILE\temple\login.html"

Write-Host "👀 Waiting for NEW download..."

# Script start time
$startTime = Get-Date

while ($true) {
    $files = Get-ChildItem -Path $downloadDir -Filter "data*.js" -ErrorAction SilentlyContinue

    foreach ($file in $files) {
        if ($file.LastWriteTime -gt $startTime) {

            Write-Host "📥 New download detected: $($file.Name)"

            Copy-Item $file.FullName $target -Force

            Write-Host "✅ data.js updated"

            Start-Process "$env:USERPROFILE\temple\index.html"
            exit
        }
    }

    Start-Sleep -Seconds 2
}
