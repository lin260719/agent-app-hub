import type { ToolDefinition, AgentAppManifest } from '../../agent/types/agent';
import { VirtualPianoPage } from './VirtualPianoPage';

const systemPrompt = `你是一位專業且熱情的「AI 虛擬鋼琴音樂導師與演奏家 (Virtual Piano Agent)」。
你具備音樂理論知識，並能親自在畫面的 24 鍵 HTML5 Web Audio 合成器鋼琴上，為使用者即時彈奏優美動聽的樂曲與音符片段。

【核心能力與行為規範】
1. **樂曲自動演示**：當使用者要求彈奏某首歌曲（如「請幫我彈奏一首 A 小調天空之城」或「彈奏給愛麗絲」），你應熱情說明該曲目的音樂背景與風采，並主動呼叫 \`play_predefined_song\` 工具為使用者發起現場即時演奏。
2. **自訂音符彈奏**：當使用者想聽特定音階、和絃或自訂旋律時（如「彈奏 C 大調三和絃」或「彈彈看 C4-E4-G4」），你應呼叫 \`play_note_sequence\` 工具彈奏指定的音符序列。
3. **琴音與音色調整**：當使用者希望調整琴聲大小或音色風格（正弦波、方波、鋸齒波、三角波），你可以呼叫 \`set_synth_settings\` 工具進行調整。
4. **音樂教學與互動**：解說唱名 (Do, Re, Mi, Fa, Sol, La, Si)、調式 (A minor, C major) 與和聲原理，引導使用者使用鍵盤快捷鍵（如 Z, X, C, V, B, N, M...）一起彈奏。`;

const tools: ToolDefinition[] = [
  {
    name: 'play_predefined_song',
    description: '在虛擬鋼琴上播放內建的示範樂曲（如天空之城 Castle in the Sky、給愛麗絲 Für Elise、卡農 Canon in D、小星星、歡樂頌）。',
    parameters: {
      type: 'OBJECT',
      properties: {
        songId: {
          type: 'STRING',
          enum: ['castle_in_the_sky', 'fur_elise', 'canon_in_d', 'twinkle_twinkle', 'ode_to_joy'],
          description: '欲播放的歌曲 ID',
        },
      },
      required: ['songId'],
    },
  },
  {
    name: 'play_note_sequence',
    description: '在虛擬鋼琴上按照指定的音符列表依序彈奏旋律。',
    parameters: {
      type: 'OBJECT',
      properties: {
        notes: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: "音符陣列，如 ['C4', 'E4', 'G4', 'B4', 'C5']",
        },
        durationMs: { type: 'NUMBER', description: '每個音符持續時間 (毫秒)，預設為 400ms' },
        gapMs: { type: 'NUMBER', description: '音符間隔時間 (毫秒)，預設為 100ms' },
      },
      required: ['notes'],
    },
  },
  {
    name: 'set_synth_settings',
    description: '調整虛擬鋼琴的合成器音色與音量設定。',
    parameters: {
      type: 'OBJECT',
      properties: {
        volume: { type: 'NUMBER', description: '音量大小 (0.0 到 1.0)' },
        waveform: {
          type: 'STRING',
          enum: ['sine', 'square', 'sawtooth', 'triangle'],
          description: '波形選擇 (sine: 正弦波, square: 方波, sawtooth: 鋸齒波, triangle: 三角波)',
        },
      },
    },
  },
  {
    name: 'stop_playback',
    description: '立即停止當前正在自動演奏的歌曲或音符序列。',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'get_piano_state',
    description: '取得虛擬鋼琴目前的合成器設定、示範歌曲列表與演奏紀錄。',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
];

export const class13VirtualPianoAgentManifest: AgentAppManifest = {
  agentAppId: 'class13-virtual-piano-agent',
  agentAppName: 'AI 互動虛擬琴房 (Virtual Piano Agent)',
  description: '支援滑鼠與電腦鍵盤彈奏的 HTML5 雙八度合成器鋼琴，結合音符瀑布流視覺化與 AI Agent 音樂自動演奏展示。',
  route: '/app/class13-virtual-piano-agent',
  systemPrompt,
  availableTools: tools,
  MainView: VirtualPianoPage,
  icon: '🎹',
  category: '音樂與多媒體',
  appVersion: '1.0.0',
  courseId: 'COURSE12',
  sortOrder: 13,
  fullPage: true,
  exampleQuestions: [
    '請幫我彈奏一首 A 小調旋律——久石讓的《天空之城》！',
    '請幫我彈奏經典的古典名曲貝多芬《給愛麗絲》！',
    '請彈彈看 C 大調主三和絃 (C4 - E4 - G4 - C5)',
    '請幫我將音色切換為方波 (Square Wave)，並調大音量。',
  ],
};
