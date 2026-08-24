const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + duration);
}

export function playMoveSound() {
  playTone(440, 0.1, 'sine', 0.3);
  setTimeout(() => playTone(550, 0.15, 'sine', 0.3), 100);
}

export function playCaptureSound() {
  playTone(220, 0.15, 'sawtooth', 0.3);
  setTimeout(() => playTone(440, 0.1, 'sine', 0.25), 100);
  setTimeout(() => playTone(660, 0.2, 'sine', 0.35), 200);
}

export function playCheckSound() {
  playTone(880, 0.15, 'sawtooth', 0.2);
  setTimeout(() => playTone(660, 0.15, 'sawtooth', 0.2), 150);
}

export function playCheckmateSound() {
  playTone(220, 0.3, 'square', 0.35);
  setTimeout(() => playTone(330, 0.2, 'sawtooth', 0.3), 200);
  setTimeout(() => playTone(440, 0.2, 'sine', 0.35), 400);
  setTimeout(() => playTone(880, 0.5, 'sine', 0.45), 600);
}
