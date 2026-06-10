#!/usr/bin/env python3
"""
Video Dubbing Desktop App
=========================
Local web server that dubs YouTube videos using:
- yt-dlp (YouTube download)
- Whisper (transcription)
- googletrans (translation)
- Edge TTS (text-to-speech)
- FFmpeg (audio mixing)

Usage:
    python app.py
    Then open http://localhost:8765
"""

import asyncio
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import webbrowser
from datetime import timedelta
from pathlib import Path

# ============================================================
# Check dependencies
# ============================================================


def check_deps():
    missing = []
    for tool in ["yt-dlp", "ffmpeg", "ffprobe"]:
        if not shutil.which(tool):
            missing.append(tool)
    for pkg, import_name in [
        ("whisper", "whisper"),
        ("srt", "srt"),
        ("googletrans", "googletrans"),
        ("edge-tts", "edge_tts"),
    ]:
        try:
            __import__(import_name)
        except ImportError:
            missing.append(f"pip package: {pkg}")

    if missing:
        print("Missing dependencies:")
        for m in missing:
            print(f"  - {m}")
        print("\nInstall with:")
        print(
            "  pip install openai-whisper srt googletrans==4.0.0rc1 edge-tts fastapi uvicorn"
        )
        print("  And install yt-dlp + ffmpeg from their official sites")
        sys.exit(1)


# ============================================================
# Pipeline
# ============================================================

WORK_DIR = tempfile.mkdtemp(prefix="dubbing_")
EDGE_VOICES = {
    "fr": "fr-FR-HenriNeural",
    "pt": "pt-BR-AntonioNeural",
}

# Progress state
progress_state = {
    "step": "",
    "percent": 0,
    "logs": [],
    "status": "idle",
    "result": None,
    "error": None,
}


def log(msg):
    print(msg)
    progress_state["logs"].append(msg)


def download_video(url, output_dir):
    log(f"[download] Downloading from: {url}")
    os.makedirs(output_dir, exist_ok=True)

    video_template = os.path.join(output_dir, "video.%(ext)s")
    subprocess.run(
        [
            "yt-dlp",
            "-f",
            "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
            "--merge-output-format",
            "mp4",
            "-o",
            video_template,
            url,
        ],
        check=True,
    )

    video_path = None
    for f in os.listdir(output_dir):
        if f.startswith("video.") and f.endswith((".mp4", ".mkv", ".webm")):
            video_path = os.path.join(output_dir, f)
            break

    if not video_path:
        raise FileNotFoundError("Video download failed")

    audio_path = os.path.join(output_dir, "audio.wav")
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            video_path,
            "-vn",
            "-acodec",
            "pcm_s16le",
            "-ar",
            "16000",
            "-ac",
            "1",
            audio_path,
        ],
        check=True,
        capture_output=True,
    )

    log(f"[download] Video: {video_path}")
    log(f"[download] Audio: {audio_path}")
    return video_path, audio_path


def transcribe_audio(audio_path, model_size="base"):
    import whisper
    import srt as srt_lib

    log(f"[transcribe] Loading Whisper model: {model_size}")
    progress_state["step"] = "transcribe"
    progress_state["percent"] = 10

    model = whisper.load_model(model_size)
    progress_state["percent"] = 20

    log("[transcribe] Transcribing...")
    result = model.transcribe(audio_path, word_timestamps=True)
    progress_state["percent"] = 40

    subtitles = []
    for i, seg in enumerate(result["segments"], start=1):
        subtitles.append(
            srt_lib.Subtitle(
                index=i,
                start=timedelta(seconds=seg["start"]),
                end=timedelta(seconds=seg["end"]),
                content=seg["text"].strip(),
            )
        )

    srt_path = os.path.join(os.path.dirname(audio_path), "transcript.srt")
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write(srt_lib.compose(subtitles))

    log(f"[transcribe] {len(subtitles)} segments generated")
    return srt_path


def translate_srt(srt_path, target_lang):
    import srt as srt_lib
    from googletrans import Translator

    log(f"[translate] Translating to {target_lang}...")
    progress_state["step"] = "translate"
    progress_state["percent"] = 45

    with open(srt_path, "r", encoding="utf-8") as f:
        subtitles = list(srt_lib.parse(f.read()))

    translator = Translator()
    translated = []

    for i in range(0, len(subtitles), 20):
        batch = subtitles[i : i + 20]
        try:
            results = translator.translate([s.content for s in batch], dest=target_lang)
            for sub, trans in zip(batch, results):
                text = re.sub(r"([.!?:])([A-ZÀ-ÖØ-Þa-zà-öø-ÿ])", r"\1 \2", trans.text)
                text = re.sub(r"  +", " ", text).strip()
                translated.append(
                    srt_lib.Subtitle(
                        index=sub.index,
                        start=sub.start,
                        end=sub.end,
                        content=text,
                    )
                )
        except Exception as e:
            log(f"[translate] Warning: batch failed ({e})")
            for sub in batch:
                try:
                    trans = translator.translate(sub.content, dest=target_lang)
                    translated.append(
                        srt_lib.Subtitle(
                            index=sub.index,
                            start=sub.start,
                            end=sub.end,
                            content=trans.text,
                        )
                    )
                except Exception:
                    translated.append(sub)

        progress_state["percent"] = 45 + int((i / len(subtitles)) * 25)

    out_path = os.path.join(os.path.dirname(srt_path), f"transcript_{target_lang}.srt")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(srt_lib.compose(translated))

    log(f"[translate] {len(translated)} segments translated")
    return out_path


async def generate_tts(translated_srt_path, lang, output_dir):
    import srt as srt_lib
    import edge_tts

    log(f"[tts] Voice: {EDGE_VOICES.get(lang, lang)}")
    progress_state["step"] = "tts"
    progress_state["percent"] = 70

    voice = EDGE_VOICES.get(lang, lang)
    os.makedirs(output_dir, exist_ok=True)

    with open(translated_srt_path, "r", encoding="utf-8") as f:
        subtitles = list(srt_lib.parse(f.read()))

    segments = []
    for i, sub in enumerate(subtitles):
        text = re.sub(r"[^\w\s.,;:!?'\-]", "", sub.content, flags=re.UNICODE)
        text = re.sub(r"\s+", " ", text).strip()
        if not text:
            continue

        audio_path = os.path.join(output_dir, f"seg_{sub.index:04d}.wav")
        try:
            comm = edge_tts.Communicate(text, voice)
            await comm.save(audio_path)
            if os.path.exists(audio_path) and os.path.getsize(audio_path) > 0:
                segments.append(
                    {
                        "index": sub.index,
                        "start": sub.start.total_seconds(),
                        "end": sub.end.total_seconds(),
                        "audio_path": audio_path,
                    }
                )
        except Exception as e:
            log(f"[tts] Error segment {sub.index}: {e}")

        if i % 5 == 0:
            progress_state["percent"] = 70 + int((i / len(subtitles)) * 15)

    meta_path = os.path.join(output_dir, "segments.json")
    with open(meta_path, "w") as f:
        json.dump(segments, f, indent=2)

    log(f"[tts] {len(segments)}/{len(subtitles)} segments generated")
    return segments


def mix_audio(video_path, tts_dir, original_volume=0.2, output_path=None):
    log("[mix] Mixing audio...")
    progress_state["step"] = "mix"
    progress_state["percent"] = 90

    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", video_path],
        capture_output=True,
        text=True,
    )
    duration = float(json.loads(result.stdout)["format"]["duration"])

    meta_path = os.path.join(tts_dir, "segments.json")
    with open(meta_path) as f:
        segments = json.load(f)

    if not segments:
        log("[mix] No TTS segments, copying video as-is")
        output_path = output_path or video_path.replace(".", "_dubbed.")
        shutil.copy2(video_path, output_path)
        return output_path

    inputs = ["-i", video_path]
    filter_parts = [f"[0:a]volume={original_volume}[original]"]
    delayed = []

    for i, seg in enumerate(segments):
        inputs.extend(["-i", seg["audio_path"]])
        delay_ms = int(seg["start"] * 1000)
        label = f"d{i}"
        filter_parts.append(f"[{i + 1}:a]adelay={delay_ms}|{delay_ms}[{label}]")
        delayed.append(f"[{label}]")

    n = len(delayed)
    filter_parts.append(
        f"{''.join(delayed)}amix=inputs={n}:duration=longest:dropout_transition=0:normalize=0[tts_raw]"
    )
    filter_parts.append(f"[tts_raw]apad=whole_dur={int(duration * 1000)}[tts]")
    filter_parts.append(
        f"[original][tts]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[aout]"
    )

    if output_path is None:
        base, ext = os.path.splitext(video_path)
        output_path = f"{base}_dubbed.mp4"

    cmd = [
        "ffmpeg",
        "-y",
        *inputs,
        "-filter_complex",
        ";".join(filter_parts),
        "-map",
        "0:v",
        "-map",
        "[aout]",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-shortest",
        output_path,
    ]

    subprocess.run(cmd, check=True, capture_output=True)
    log(f"[mix] Output: {output_path}")
    return output_path


async def run_pipeline(youtube_url, target_lang):
    global progress_state
    progress_state = {
        "step": "download",
        "percent": 0,
        "logs": [],
        "status": "running",
        "result": None,
        "error": None,
    }

    work_dir = os.path.join(WORK_DIR, f"job_{int(time.time())}")
    os.makedirs(work_dir, exist_ok=True)

    try:
        log("STEP 1/5: Downloading video...")
        video_path, audio_path = download_video(youtube_url, work_dir)

        log("STEP 2/5: Transcribing...")
        srt_path = transcribe_audio(audio_path)

        log("STEP 3/5: Translating...")
        translated_path = translate_srt(srt_path, target_lang)

        log("STEP 4/5: Generating TTS...")
        tts_dir = os.path.join(work_dir, "tts_segments")
        await generate_tts(translated_path, target_lang, tts_dir)

        log("STEP 5/5: Mixing audio...")
        output_name = f"dubbed_{target_lang}_{int(time.time())}.mp4"
        output_path = os.path.join(work_dir, output_name)
        final_path = mix_audio(video_path, tts_dir, output_path=output_path)

        # Copy to desktop for easy access
        desktop = str(Path.home() / "Desktop")
        desktop_path = os.path.join(desktop, output_name)
        shutil.copy2(final_path, desktop_path)

        progress_state["status"] = "done"
        progress_state["percent"] = 100
        progress_state["result"] = {
            "path": final_path,
            "desktop_path": desktop_path,
        }
        log(f"\nDONE! Video saved to: {desktop_path}")

    except Exception as e:
        progress_state["status"] = "error"
        progress_state["error"] = str(e)
        log(f"ERROR: {e}")


# ============================================================
# Web Server (minimal HTTP, no FastAPI dependency needed)
# ============================================================

from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse
import socket


class DubbingHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == "/" or parsed.path == "/index.html":
            self.serve_file("index.html", "text/html")
        elif parsed.path == "/api/progress":
            self.sse_progress()
        elif parsed.path.startswith("/api/video/"):
            self.serve_video(parsed.path)
        else:
            self.send_error(404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == "/api/dub":
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            url = body.get("url", "")
            lang = body.get("language", "fr")

            if not url or lang not in ("fr", "pt"):
                self.send_json({"error": "Invalid input"}, 400)
                return

            thread = threading.Thread(
                target=lambda: asyncio.run(run_pipeline(url, lang)),
                daemon=True,
            )
            thread.start()
            self.send_json({"status": "started"})
        else:
            self.send_error(404)

    def serve_file(self, filename, content_type):
        file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), filename)
        if not os.path.exists(file_path):
            self.send_error(404)
            return
        with open(file_path, "rb") as f:
            data = f.read()
        self.send_response(200)
        self.send_header("Content-Type", f"{content_type}; charset=utf-8")
        self.end_headers()
        self.wfile.write(data)

    def serve_video(self, path):
        video_path = path[len("/api/video/") :]
        video_path = video_path.replace("/", os.sep).replace("\\", os.sep)
        # Normalize drive letter
        if len(video_path) > 2 and video_path[1] == ":":
            video_path = video_path[0].upper() + video_path[1:]

        if not os.path.exists(video_path):
            self.send_error(404)
            return

        file_size = os.path.getsize(video_path)
        self.send_response(200)
        self.send_header("Content-Type", "video/mp4")
        self.send_header("Content-Length", str(file_size))
        self.end_headers()

        with open(video_path, "rb") as f:
            shutil.copyfileobj(f, self.wfile)

    def sse_progress(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

        while True:
            data = json.dumps(progress_state)
            self.wfile.write(f"data: {data}\n\n".encode())
            self.wfile.flush()

            if progress_state["status"] in ("done", "error"):
                break

            time.sleep(0.5)

    def send_json(self, data, status=200):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)


def find_port():
    for port in range(8765, 8800):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(("127.0.0.1", port))
                return port
        except OSError:
            continue
    return 8765


def main():
    check_deps()

    port = find_port()
    server = HTTPServer(("127.0.0.1", port), DubbingHandler)

    url = f"http://localhost:{port}"
    print(f"\n{'=' * 50}")
    print(f"  Video Dubbing App")
    print(f"  Open: {url}")
    print(f"{'=' * 50}\n")

    # Open browser after short delay
    threading.Timer(1.0, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()


if __name__ == "__main__":
    main()
