import json
import sys
import time

try:
    import pyautogui
    pyautogui.FAILSAFE = False
except ImportError:
    print("ERROR: pyautogui not installed. Run: pip install pyautogui", file=sys.stderr)
    sys.exit(1)

def get_mouse_position():
    try:
        x, y = pyautogui.position()
        screen_width, screen_height = pyautogui.size()
        return {
            'x': x,
            'y': y,
            'screenWidth': screen_width,
            'screenHeight': screen_height,
            'timestamp': time.time()
        }
    except Exception as e:
        return {'error': str(e)}

print("MOUSE_TRACKER_READY", flush=True)

while True:
    try:
        data = get_mouse_position()
        print(json.dumps(data), flush=True)
        time.sleep(0.016)  # ~60fps
    except KeyboardInterrupt:
        break
    except Exception as e:
        print(json.dumps({'error': str(e)}), flush=True)
        time.sleep(1)
