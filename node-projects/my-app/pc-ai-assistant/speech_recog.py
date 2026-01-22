import speech_recognition as sr
import sys

def recognize_speech():
    r = sr.Recognizer()
    print("DEBUG: Initializing microphone...", file=sys.stderr)
    mic_list = sr.Microphone.list_microphone_names()
    # Try to use Blue Snowball if available, otherwise default
    device_index = None
    for i, name in enumerate(mic_list):
        if 'Blue Snowball' in name:
            device_index = i
            break
    if device_index is None and mic_list:
        device_index = 0  # fallback to default
    selected_mic_name = mic_list[device_index] if device_index is not None else "No microphones found"
    print(f"DEBUG: Available microphones: {mic_list}", file=sys.stderr)
    print(f"DEBUG: Using microphone: '{selected_mic_name}' (index {device_index})", file=sys.stderr)
    with sr.Microphone(device_index=device_index) as source:
        print("DEBUG: Adjusting for ambient noise...", file=sys.stderr)
        r.adjust_for_ambient_noise(source, duration=1)
        print("DEBUG: Starting to listen for sound...", file=sys.stderr)
        try:
            audio = r.listen(source, timeout=10, phrase_time_limit=10)
            print("DEBUG: Audio captured, now interpreting...", file=sys.stderr)
            text = r.recognize_google(audio)
            print(f"DEBUG: Interpreted text: '{text}'", file=sys.stderr)
            print("DEBUG: Sending to AI...", file=sys.stderr)
            print(text)
        except sr.WaitTimeoutError:
            print("DEBUG: Timeout - no speech detected", file=sys.stderr)
            print("")
        except sr.UnknownValueError:
            print("DEBUG: Could not understand audio", file=sys.stderr)
            print("")
        except sr.RequestError as e:
            print(f"DEBUG: Recognition service error: {e}", file=sys.stderr)
            print("")

if __name__ == "__main__":
    recognize_speech()
