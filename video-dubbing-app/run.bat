@echo off
echo Video Dubbing App
echo =================
echo Starting server...
echo.
python app.py
if errorlevel 1 (
    echo.
    echo Python not found or dependencies missing.
    echo Install Python 3.10+ and run: pip install -r requirements.txt
    pause
)
