---
name: dev-progress-video
description: Generate portrait (9:16) videos showcasing yesterday's development progress with AI voiceover narration in 1st person professional narrative.
origin: custom
---

# Dev Progress Video

Generate daily development progress videos showing yesterday's commits with AI voiceover narration.

## When to Activate

- User wants "dev progress video", "daily progress video", "work summary video"
- User says "generate my dev progress video", "create daily recap video"
- User asks for "video of my commits yesterday", "make my work summary video"

## Pipeline Overview

```
Git Commits (Yesterday)
   → Parse commits from local repos
   → Transform to 1st person narrative
   → Generate TTS voiceover (Nari Labs dia)
   → Mix with background music
   → Render Remotion composition
   → Export MP4 (1080x1920 portrait)
```

## Settings

| Setting | Value |
|---------|-------|
| Date range | Yesterday only |
| Narrative | 1st person, professional |
| Content | WIP + completed commits |
| Format | Portrait 9:16 (1080x1920) |
| Duration | Max 30 seconds |
| Audio | Voice 100%, Music 30% |
| Background | Dark (#0a0a0a) |

## Workflow Steps

### Step 1: Configure Repository Paths

Edit `lib/config.py` to specify which local git repos to scan:

```python
REPO_PATHS = [
    "C:/path/to/repo1",
    "C:/path/to/repo2",
]
```

### Step 2: Run the Pipeline

```bash
cd C:/Users/Mickael M/.opencode/skills/dev-progress-video

# Run all steps via main script
python -m lib.get_commits
python -m lib.narrative
python -m lib.tts_dia

# Or use the convenience runner
python run.py
```

### Step 3: Render Video

```bash
# Render with Remotion
npx remotion render templates/Root.tsx MyDevProgress output/dev-progress.mp4

# Or preview in browser
npx remotion preview templates/Root.tsx
```

## Component Scripts

### lib/get_commits.py

Parses git commits from configured repositories for yesterday's date.

```python
# Returns list of:
# {
#     "project": "project-name",
#     "message": "Original commit message",
#     "hash": "abc1234",
#     "author": "Author Name"
# }
```

### lib/narrative.py

Transforms commit messages to 1st person professional narrative:

| Input | Output |
|-------|--------|
| "fix: resolve login redirect" | "I fixed a redirect issue in the login flow" |
| "feat: add dark mode toggle" | "I added a dark mode toggle to settings" |
| "wip: refactor user service" | "I started refactoring the user service" |
| "chore: update dependencies" | "I updated project dependencies" |

### lib/tts_dia.py

Uses Nari Labs dia TTS to generate voiceover audio.

```bash
# Install dia
pip install dia-tts

# Or use via API
python -m lib.tts_dia --text "I fixed a bug in the login flow"
```

## Visual Style

- **Resolution:** 1080x1920 (portrait 9:16)
- **Background:** Dark (#0a0a0a)
- **Typography:**
  - Title: 56px, white
  - Project: 40px, white
  - Body: 28px, white
- **Animations:** Quick fade-in (0.2s), slide-up transitions
- **Iconography:** Simple SVG icons or emoji for commit types

## Template Components

- **templates/Root.tsx** — Main Remotion composition
- **templates/Intro.tsx** — Title card "My Dev Progress"
- **templates/ProjectCard.tsx** — Per-project commit highlights
- **templates/CommitItem.tsx** — Individual commit display
- **templates/Outro.tsx** — CTA / "Follow for more"

## Audio Mixing

Voice and music are mixed with:
- Voice: 100% volume
- Music: 30% volume (background)

```bash
# Mix audio with FFmpeg
ffmpeg -i voiceover.mp3 -i background_music.mp3 -filter_complex "[0:a]volume=1[a1];[1:a]volume=0.3[a2];[a1][a2]amix=inputs=2:duration=longest" -shortest output.mp3
```

## Output

The skill produces:
1. `output/dev-progress.mp4` — Final video file
2. Duration of the video (max 30s)
3. List of projects and commits included

## Related Skills

- `video-editing` — General video editing workflow
- `beat-sync-video-editing` — Beat-synced video edits
- `frontend-design` — UI design for video overlays