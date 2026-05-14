# Create video from screenshots
$scenes = @(
    @{ file="promo-scene-1.png"; duration=2 },
    @{ file="promo-scene-2.png"; duration=3 },
    @{ file="promo-scene-3.png"; duration=2 },
    @{ file="promo-scene-4.png"; duration=2 },
    @{ file="promo-scene-5.png"; duration=3 },
    @{ file="promo-scene-6.png"; duration=3 }
)

# Create concat file
$concatContent = ""
foreach ($scene in $scenes) {
    $concatContent += "file '$($scene.file)'`n"
    $concatContent += "duration $($scene.duration)`n"
}
# Add last file again (FFmpeg requirement)
$concatContent += "file '$($scenes[-1].file)'"

Set-Content -Path "concat.txt" -Value $concatContent

# Generate video with FFmpeg
& "C:\Users\Mickael M\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0.1-full_build\bin\ffmpeg.exe" `
    -f concat `
    -safe 0 `
    -i concat.txt `
    -vf "fps=30,scale=1920:1080" `
    -c:v libx264 `
    -pix_fmt yuv420p `
    -y `
    media-processor-promo.mp4

Write-Host "Video created: media-processor-promo.mp4"
