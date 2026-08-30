import type { NoteName, WaveformType, SynthSettings } from '../types';

const NOTE_TO_MIDI: Record<NoteName, number> = {
  'C4': 60, 'C#4': 61, 'D4': 62, 'D#4': 63, 'E4': 64, 'F4': 65, 'F#4': 66, 'G4': 67, 'G#4': 68, 'A4': 69, 'A#4': 70, 'B4': 71,
  'C5': 72, 'C#5': 73, 'D5': 74, 'D#5': 75, 'E5': 76, 'F5': 77, 'F#5': 78, 'G5': 79, 'G#5': 80, 'A5': 81, 'A#5': 82, 'B5': 83,
  'C6': 84,
};

export const getNoteFrequency = (note: NoteName): number => {
  const midi = NOTE_TO_MIDI[note] || 60;
  return 440 * Math.pow(2, (midi - 69) / 12);
};

export const NOTE_SOLFEGE: Record<NoteName, string> = {
  'C4': 'Do', 'C#4': 'Do#', 'D4': 'Re', 'D#4': 'Re#', 'E4': 'Mi', 'F4': 'Fa', 'F#4': 'Fa#', 'G4': 'Sol', 'G#4': 'Sol#', 'A4': 'La', 'A#4': 'La#', 'B4': 'Si',
  'C5': 'Do', 'C#5': 'Do#', 'D5': 'Re', 'D#5': 'Re#', 'E5': 'Mi', 'F5': 'Fa', 'F#5': 'Fa#', 'G5': 'Sol', 'G#5': 'Sol#', 'A5': 'La', 'A#5': 'La#', 'B5': 'Si',
  'C6': 'Do',
};

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playAudioNote = (note: NoteName, settings: SynthSettings, durationSeconds = 0.5) => {
  try {
    const ctx = getAudioContext();
    const freq = getNoteFrequency(note);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = settings.waveform || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    const now = ctx.currentTime;
    const vol = Math.max(0.01, Math.min(1.0, settings.volume));
    const attack = settings.attack || 0.02;
    const release = settings.release || 0.3;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds + release);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSeconds + release + 0.05);
  } catch (e) {
    console.error('Failed to play note audio:', e);
  }
};
