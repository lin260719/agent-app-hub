export type NoteName =
  | 'C4' | 'C#4' | 'D4' | 'D#4' | 'E4' | 'F4' | 'F#4' | 'G4' | 'G#4' | 'A4' | 'A#4' | 'B4'
  | 'C5' | 'C#5' | 'D5' | 'D#5' | 'E5' | 'F5' | 'F#5' | 'G5' | 'G#5' | 'A5' | 'A#5' | 'B5'
  | 'C6';

export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface SynthSettings {
  volume: number; // 0.0 to 1.0 (e.g. 0.6 = 60%)
  waveform: WaveformType;
  attack: number; // seconds
  release: number; // seconds
}

export interface KeyBinding {
  note: NoteName;
  keyLabel: string;
  isBlack: boolean;
  frequency: number;
}

export interface NoteEvent {
  note: NoteName;
  duration?: number; // duration in ms
  delay?: number; // delay before this note in ms
}

export interface Song {
  id: string;
  title: string;
  keySignature: string;
  bpm: number;
  notes: NoteEvent[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  actor: 'User' | 'AI';
  note: NoteName;
  solfege: string; // e.g. Do, Re, Mi, Fa, Sol, La, Si
}
