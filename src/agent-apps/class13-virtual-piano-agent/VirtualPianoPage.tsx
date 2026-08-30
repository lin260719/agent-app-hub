import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAgent } from '../../agent/hooks/useAgent';
import type { NoteName, WaveformType, SynthSettings, KeyBinding, LogEntry } from './types';
import { playAudioNote, NOTE_SOLFEGE } from './services/audioEngine';
import { PRESET_SONGS } from './data/presetSongs';

// 24 Keys Mapping (C4 to C6)
const KEY_BINDINGS: KeyBinding[] = [
  // Octave 4
  { note: 'C4', keyLabel: 'Z', isBlack: false, frequency: 261.63 },
  { note: 'C#4', keyLabel: 'S', isBlack: true, frequency: 277.18 },
  { note: 'D4', keyLabel: 'X', isBlack: false, frequency: 293.66 },
  { note: 'D#4', keyLabel: 'D', isBlack: true, frequency: 311.13 },
  { note: 'E4', keyLabel: 'C', isBlack: false, frequency: 329.63 },
  { note: 'F4', keyLabel: 'V', isBlack: false, frequency: 349.23 },
  { note: 'F#4', keyLabel: 'G', isBlack: true, frequency: 369.99 },
  { note: 'G4', keyLabel: 'B', isBlack: false, frequency: 392.00 },
  { note: 'G#4', keyLabel: 'H', isBlack: true, frequency: 415.30 },
  { note: 'A4', keyLabel: 'N', isBlack: false, frequency: 440.00 },
  { note: 'A#4', keyLabel: 'J', isBlack: true, frequency: 466.16 },
  { note: 'B4', keyLabel: 'M', isBlack: false, frequency: 493.88 },
  // Octave 5
  { note: 'C5', keyLabel: 'Q', isBlack: false, frequency: 523.25 },
  { note: 'C#5', keyLabel: '2', isBlack: true, frequency: 554.37 },
  { note: 'D5', keyLabel: 'W', isBlack: false, frequency: 587.33 },
  { note: 'D#5', keyLabel: '3', isBlack: true, frequency: 622.25 },
  { note: 'E5', keyLabel: 'E', isBlack: false, frequency: 659.25 },
  { note: 'F5', keyLabel: 'R', isBlack: false, frequency: 698.46 },
  { note: 'F#5', keyLabel: '5', isBlack: true, frequency: 739.99 },
  { note: 'G5', keyLabel: 'T', isBlack: false, frequency: 783.99 },
  { note: 'G#5', keyLabel: '6', isBlack: true, frequency: 830.61 },
  { note: 'A5', keyLabel: 'Y', isBlack: false, frequency: 880.00 },
  { note: 'A#5', keyLabel: '7', isBlack: true, frequency: 932.33 },
  { note: 'B5', keyLabel: 'U', isBlack: false, frequency: 987.77 },
  // Octave 6 (End C6)
  { note: 'C6', keyLabel: 'I', isBlack: false, frequency: 1046.50 },
];

export const VirtualPianoPage: React.FC = () => {
  const { registerToolHandlers } = useAgent();

  // Synth settings
  const [synthSettings, setSynthSettings] = useState<SynthSettings>({
    volume: 0.6,
    waveform: 'sine',
    attack: 0.02,
    release: 0.3,
  });

  // Currently active/playing notes for visual highlight
  const [activeNotes, setActiveNotes] = useState<Record<string, boolean>>({});
  // Selected song for playback
  const [selectedSongId, setSelectedSongId] = useState<string>('castle_in_the_sky');
  const [isPlayingSong, setIsPlayingSong] = useState(false);
  // Log entries
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Refs for animation & playback timeouts
  const songTimeoutsRef = useRef<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waterfallNotesRef = useRef<{ note: NoteName; x: number; y: number; height: number; color: string }[]>([]);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  // Add Log helper
  const addLog = useCallback((actor: 'User' | 'AI', note: NoteName) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-TW', { hour12: true });
    const solfege = NOTE_SOLFEGE[note] || note;
    const newEntry: LogEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: timeStr,
      actor,
      note,
      solfege,
    };
    setLogs((prev) => [newEntry, ...prev.slice(0, 49)]);
  }, []);

  // Trigger Note Action (sound + visual key highlight + waterfall block + log)
  const triggerNote = useCallback(
    (note: NoteName, actor: 'User' | 'AI' = 'User', durationSeconds = 0.5) => {
      // 1. Play Audio Sound
      playAudioNote(note, synthSettings, durationSeconds);

      // 2. Highlight Key
      setActiveNotes((prev) => ({ ...prev, [note]: true }));
      setTimeout(() => {
        setActiveNotes((prev) => ({ ...prev, [note]: false }));
      }, Math.max(200, durationSeconds * 1000));

      // 3. Add to Log
      addLog(actor, note);

      // 4. Add Waterfall block to Canvas
      const keyIndex = KEY_BINDINGS.findIndex((k) => k.note === note);
      if (keyIndex !== -1 && canvasRef.current) {
        const canvas = canvasRef.current;
        const totalKeys = KEY_BINDINGS.filter((k) => !k.isBlack).length;
        const keyWidth = canvas.width / totalKeys;

        // Calculate X position
        let xPos = 0;
        let whiteCount = 0;
        for (let i = 0; i <= keyIndex; i++) {
          if (!KEY_BINDINGS[i].isBlack) {
            whiteCount++;
          }
        }
        const isBlack = KEY_BINDINGS[keyIndex].isBlack;
        if (isBlack) {
          xPos = (whiteCount - 0.35) * keyWidth;
        } else {
          xPos = (whiteCount - 1) * keyWidth;
        }

        waterfallNotesRef.current.push({
          note,
          x: xPos,
          y: 0,
          height: isBlack ? 35 : 50,
          color: isBlack ? '#a855f7' : '#3b82f6',
        });
      }
    },
    [synthSettings, addLog]
  );

  // Stop Song Playback
  const stopSongPlayback = useCallback(() => {
    songTimeoutsRef.current.forEach((t) => clearTimeout(t));
    songTimeoutsRef.current = [];
    setIsPlayingSong(false);
  }, []);

  // Play Predefined Song Helper
  const playSongById = useCallback(
    (songId: string) => {
      stopSongPlayback();
      const song = PRESET_SONGS.find((s) => s.id === songId);
      if (!song) return;

      setIsPlayingSong(true);
      const timeouts: number[] = [];

      song.notes.forEach((item) => {
        const t = window.setTimeout(() => {
          triggerNote(item.note, 'AI', (item.duration || 400) / 1000);
        }, item.delay);
        timeouts.push(t);
      });

      // Reset state after last note
      const lastNote = song.notes[song.notes.length - 1];
      const totalDuration = (lastNote ? lastNote.delay + (lastNote.duration || 400) : 0) + 500;
      const endTimer = window.setTimeout(() => {
        setIsPlayingSong(false);
      }, totalDuration);
      timeouts.push(endTimer);

      songTimeoutsRef.current = timeouts;
    },
    [stopSongPlayback, triggerNote]
  );

  // Play Custom Note Sequence
  const playSequence = useCallback(
    (notes: NoteName[], durationMs = 400, gapMs = 100) => {
      stopSongPlayback();
      setIsPlayingSong(true);
      const timeouts: number[] = [];

      notes.forEach((note, index) => {
        const delay = index * (durationMs + gapMs);
        const t = window.setTimeout(() => {
          triggerNote(note, 'AI', durationMs / 1000);
        }, delay);
        timeouts.push(t);
      });

      const totalDuration = notes.length * (durationMs + gapMs) + 500;
      const endTimer = window.setTimeout(() => {
        setIsPlayingSong(false);
      }, totalDuration);
      timeouts.push(endTimer);

      songTimeoutsRef.current = timeouts;
    },
    [stopSongPlayback, triggerNote]
  );

  // Register Agent Tool Handlers
  useEffect(() => {
    registerToolHandlers({
      play_predefined_song: async (args: { songId: string }) => {
        const song = PRESET_SONGS.find((s) => s.id === args.songId);
        if (!song) return { error: `找不到樂曲 ID: ${args.songId}` };

        setSelectedSongId(args.songId);
        playSongById(args.songId);
        return {
          success: true,
          title: song.title,
          message: `正在為您演奏《${song.title}》（${song.keySignature}）！請在畫面上聆聽與觀賞音符瀑布。`,
        };
      },

      play_note_sequence: async (args: { notes: NoteName[]; durationMs?: number; gapMs?: number }) => {
        if (!args.notes || !Array.isArray(args.notes) || args.notes.length === 0) {
          return { error: '請提供有效的音符陣列，例如 ["C4", "E4", "G4", "C5"]' };
        }
        playSequence(args.notes, args.durationMs || 400, args.gapMs || 100);
        return {
          success: true,
          playedNotes: args.notes,
          message: `正在為您彈奏音符序列: ${args.notes.join(' - ')}`,
        };
      },

      set_synth_settings: async (args: { volume?: number; waveform?: WaveformType }) => {
        setSynthSettings((prev) => ({
          ...prev,
          volume: args.volume !== undefined ? Math.max(0, Math.min(1, args.volume)) : prev.volume,
          waveform: args.waveform || prev.waveform,
        }));
        return {
          success: true,
          message: `已更新音色設定：音量 ${Math.round((args.volume ?? synthSettings.volume) * 100)}%，波形 ${args.waveform || synthSettings.waveform}。`,
        };
      },

      stop_playback: async () => {
        stopSongPlayback();
        return { success: true, message: '已停止琴房自動演奏。' };
      },

      get_piano_state: async () => {
        return {
          synthSettings,
          isPlayingSong,
          selectedSongId,
          presetSongs: PRESET_SONGS.map((s) => ({ id: s.id, title: s.title, keySignature: s.keySignature })),
          recentLogsCount: logs.length,
        };
      },
    });
  }, [playSongById, playSequence, stopSongPlayback, synthSettings, isPlayingSong, selectedSongId, logs.length, registerToolHandlers]);

  // Keyboard Event Listeners for Computer Keyboard Piano Playing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't trigger if user is typing in chat/input
      }
      const key = e.key.toUpperCase();
      const binding = KEY_BINDINGS.find((k) => k.keyLabel === key);
      if (binding && !e.repeat) {
        triggerNote(binding.note, 'User', 0.5);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerNote]);

  // Canvas Waterfall Visualizer Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw horizontal glowing bar (synthesizer aesthetic)
      const grad = ctx.createLinearGradient(0, canvas.height - 30, canvas.width, canvas.height - 30);
      grad.addColorStop(0, '#3b82f6');
      grad.addColorStop(0.5, '#a855f7');
      grad.addColorStop(1, '#ec4899');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 25);
      ctx.lineTo(canvas.width, canvas.height - 25);
      ctx.stroke();

      // Render & move falling note blocks
      waterfallNotesRef.current.forEach((n) => {
        ctx.fillStyle = n.color;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(n.x, n.y, 24, n.height);
        ctx.shadowBlur = 0; // reset
        n.y += 3.5; // fall speed
      });

      // Remove notes off screen
      waterfallNotesRef.current = waterfallNotesRef.current.filter((n) => n.y < canvas.height);

      // Bottom right label
      ctx.font = '11px monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText('C4 - C6 Polyphonic Synth', canvas.width - 160, canvas.height - 8);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  // Filter white and black keys for piano render
  const whiteKeys = KEY_BINDINGS.filter((k) => !k.isBlack);

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 text-slate-100 overflow-auto font-sans p-4 md:p-6 space-y-5">
      {/* Top Header Card */}
      <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
          🎹
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            AI 互動虛擬琴房
            <span className="text-xs bg-purple-900/60 text-purple-300 border border-purple-700/50 px-2 py-0.5 rounded font-mono">
              COURSE12
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            支援滑鼠、電腦鍵盤彈奏與 AI Agent 自動音樂演示
          </p>
        </div>
      </div>

      {/* Main Piano Workspace Card */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-2xl flex flex-col items-center space-y-4">
        {/* Waterfall Screen Canvas */}
        <div className="w-full max-w-4xl h-44 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative shadow-inner">
          <canvas ref={canvasRef} width={800} height={176} className="w-full h-full block" />
        </div>

        {/* Piano Keyboard (24 Keys C4-C6) */}
        <div className="w-full max-w-4xl relative select-none pb-2">
          {/* White Keys Row */}
          <div className="flex w-full h-44 bg-slate-950 rounded-b-xl overflow-hidden border border-slate-800 p-1 gap-0.5">
            {whiteKeys.map((key) => {
              const isActive = activeNotes[key.note];
              return (
                <button
                  key={key.note}
                  onClick={() => triggerNote(key.note, 'User')}
                  className={`flex-1 rounded-b-lg flex flex-col justify-end items-center pb-2 transition-all duration-75 cursor-pointer relative shadow ${
                    isActive
                      ? 'bg-gradient-to-b from-cyan-300 to-blue-500 text-white translate-y-1 shadow-cyan-500/50'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  <span className="text-[11px] font-bold font-mono opacity-80">{key.keyLabel}</span>
                  <span className="text-[9px] font-mono text-slate-500 mt-0.5">{key.note}</span>
                </button>
              );
            })}
          </div>

          {/* Black Keys Row (Overlay Positioned) */}
          <div className="absolute top-1 left-1 right-1 h-28 pointer-events-none flex w-full px-1">
            {KEY_BINDINGS.map((key, idx) => {
              if (!key.isBlack) return null;
              const isActive = activeNotes[key.note];

              // Calculate horizontal alignment percentage
              const whiteKeyWidthPercent = 100 / whiteKeys.length;
              let whiteCountBefore = 0;
              for (let i = 0; i < idx; i++) {
                if (!KEY_BINDINGS[i].isBlack) whiteCountBefore++;
              }
              const leftPercent = whiteCountBefore * whiteKeyWidthPercent - whiteKeyWidthPercent * 0.35;

              return (
                <button
                  key={key.note}
                  onClick={() => triggerNote(key.note, 'User')}
                  style={{ left: `${leftPercent}%`, width: `${whiteKeyWidthPercent * 0.7}%` }}
                  className={`absolute top-0 h-28 rounded-b-md pointer-events-auto flex flex-col justify-end items-center pb-2 transition-all duration-75 cursor-pointer shadow-lg z-10 ${
                    isActive
                      ? 'bg-gradient-to-b from-purple-500 to-indigo-600 text-white translate-y-1 shadow-purple-500/50'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  <span className="text-[10px] font-bold font-mono text-purple-400">{key.keyLabel}</span>
                  <span className="text-[8px] font-mono text-slate-400 mt-0.5">{key.note}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Controls Grid (3 Panels) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-7xl mx-auto w-full">
        {/* Panel 1: Synth Audio Settings */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <span className="text-purple-400">⚙️</span>
            <h3 className="text-sm font-bold text-slate-200">合成音色設定</h3>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
              <span>音量大小 (Volume)</span>
              <span className="text-purple-400 font-mono">{Math.round(synthSettings.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={synthSettings.volume}
              onChange={(e) => setSynthSettings((prev) => ({ ...prev, volume: parseFloat(e.target.value) }))}
              className="w-full accent-purple-500 bg-slate-900 rounded-lg cursor-pointer h-2"
            />
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-400 mb-2">波形選擇 (Waveform)</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'sine', name: '正弦波 (Sine)' },
                { id: 'square', name: '方波 (Square)' },
                { id: 'sawtooth', name: '鋸齒波 (Saw)' },
                { id: 'triangle', name: '三角波 (Tri)' },
              ].map((w) => (
                <button
                  key={w.id}
                  onClick={() => setSynthSettings((prev) => ({ ...prev, waveform: w.id as WaveformType }))}
                  className={`px-3 py-2 rounded-xl border text-xs font-medium transition ${
                    synthSettings.waveform === w.id
                      ? 'bg-purple-600 border-purple-500 text-white font-bold shadow-lg shadow-purple-900/50'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {w.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Panel 2: Preset Demo Songs */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <span className="text-blue-400">🎵</span>
            <h3 className="text-sm font-bold text-slate-200">內建示範歌曲</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">選擇演示樂曲</label>
            <select
              value={selectedSongId}
              onChange={(e) => setSelectedSongId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {PRESET_SONGS.map((song) => (
                <option key={song.id} value={song.id} className="bg-slate-900 text-slate-200">
                  {song.title} ({song.keySignature})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => playSongById(selectedSongId)}
              disabled={isPlayingSong}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs text-white transition flex items-center justify-center gap-2 ${
                isPlayingSong
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/50'
              }`}
            >
              <span>▶️</span> 播放選取歌曲
            </button>

            {isPlayingSong && (
              <button
                onClick={stopSongPlayback}
                className="px-4 py-2.5 bg-red-900/70 hover:bg-red-800 text-red-200 border border-red-700/50 rounded-xl text-xs font-semibold transition"
              >
                ⏹️ 停止
              </button>
            )}
          </div>
        </div>

        {/* Panel 3: Live Performance Log */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-56">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400">🕒</span>
              <h3 className="text-sm font-bold text-slate-200">即時演奏日誌</h3>
            </div>
            <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-mono">
              {logs.length} 筆紀錄
            </span>
          </div>

          <div ref={logContainerRef} className="flex-1 overflow-auto space-y-1.5 font-mono text-xs pr-1">
            {logs.length === 0 ? (
              <p className="text-slate-600 text-[11px] text-center pt-8">尚無演奏紀錄。請點擊琴鍵或請 Agent 彈奏。</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-1.5 bg-slate-900/70 rounded-lg border border-slate-800/80 text-[11px]"
                >
                  <span className="text-slate-500 text-[10px]">[{log.timestamp}]</span>
                  <span className={`font-semibold ${log.actor === 'AI' ? 'text-purple-400' : 'text-cyan-400'}`}>
                    {log.actor === 'AI' ? '🤖 AI' : '👤 使用者'}
                  </span>
                  <span className="text-slate-200 font-bold">
                    {log.note} ({log.solfege})
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualPianoPage;
