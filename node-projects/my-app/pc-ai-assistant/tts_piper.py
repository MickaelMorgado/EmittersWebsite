import sys
import subprocess
import os
import winsound
import time

def speak(text):
    # Use absolute paths to avoid issues when called from different CWD
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model = os.path.join(base_dir, "models", "en_US-ljspeech-medium.onnx")
    output_file = os.path.join(base_dir, "output.wav")
    
    try:
        # Pass the text via stdin to avoid shell interpretation/injection issues
        # and support quotes/special characters.
        command = [
            'piper', 
            '--model', model, 
            '--output_file', output_file
        ]
        
        # Run piper with text as stdin
        subprocess.run(
            command, 
            input=text.encode('utf-8'),
            check=True, 
            capture_output=True
        )
        
        # Play the wav file
        if os.path.exists(output_file):
            winsound.PlaySound(output_file, winsound.SND_FILENAME)
            
    except Exception as e:
        print(f"Error in Piper TTS: {e}", file=sys.stderr)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        text_to_speak = " ".join(sys.argv[1:])
        speak(text_to_speak)
