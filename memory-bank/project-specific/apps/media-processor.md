# Media Processor

Image compression and video cropping tool with preset aspect ratios for social media.

## Features

- **Image Compression**: Bulk compress images to target file size
- **Image Resize**: Resize to specific resolutions with presets (1080p, 720p, Square, Story, OG Image)
- **Video Upload**: Support for MP4, MOV, AVI, WebM
- **Video Cropping**: Crop videos with preset ratios for social media
- **Presets**: TikTok Portrait, YouTube Shorts, YouTube 16:9, Square, Story, Landscape, 4K
- **Browser-based**: All processing happens locally in the browser

## Tech Stack

- React 19 / Next.js 15
- Canvas API for image/video processing
- JSZip for batch downloads
- Tailwind CSS

## Video Presets

| Preset | Resolution | Ratio |
|--------|-----------|-------|
| TikTok Portrait | 1080×1920 | 9:16 |
| YouTube Shorts | 1080×1920 | 9:16 |
| YouTube 16:9 | 1920×1080 | 16:9 |
| Square (Instagram) | 1080×1080 | 1:1 |
| Story | 1080×1920 | 9:16 |
| Landscape | 1920×1080 | 16:9 |
| 4K | 3840×2160 | 16:9 |

## Access

`/image-compressor`

## Version History

- **1.0.0** - Added video cropping tab with preset ratios
