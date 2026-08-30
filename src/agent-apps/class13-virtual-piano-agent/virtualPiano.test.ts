import { describe, it, expect } from 'vitest';
import { class13VirtualPianoAgentManifest } from './agentAppManifest';
import { PRESET_SONGS } from './data/presetSongs';
import { getNoteFrequency } from './services/audioEngine';

describe('Virtual Piano Agent App Manifest & Audio Engine', () => {
  it('should have valid app manifest metadata', () => {
    expect(class13VirtualPianoAgentManifest.agentAppId).toBe('class13-virtual-piano-agent');
    expect(class13VirtualPianoAgentManifest.agentAppName).toContain('AI 互動虛擬琴房');
    expect(class13VirtualPianoAgentManifest.route).toBe('/app/class13-virtual-piano-agent');
    expect(class13VirtualPianoAgentManifest.MainView).toBeDefined();
    expect(class13VirtualPianoAgentManifest.courseId).toBe('COURSE12');
  });

  it('should include 5 required piano tools', () => {
    const toolNames = class13VirtualPianoAgentManifest.availableTools.map((t) => t.name);
    expect(toolNames).toContain('play_predefined_song');
    expect(toolNames).toContain('play_note_sequence');
    expect(toolNames).toContain('set_synth_settings');
    expect(toolNames).toContain('stop_playback');
    expect(toolNames).toContain('get_piano_state');
  });

  it('should calculate correct note frequencies for A4 and C4', () => {
    const freqA4 = getNoteFrequency('A4');
    expect(Math.round(freqA4)).toBe(440);

    const freqC4 = getNoteFrequency('C4');
    expect(Math.round(freqC4)).toBe(262);
  });

  it('should contain preset songs including Castle in the Sky', () => {
    expect(PRESET_SONGS.length).toBeGreaterThanOrEqual(5);
    const castleSong = PRESET_SONGS.find((s) => s.id === 'castle_in_the_sky');
    expect(castleSong).toBeDefined();
    expect(castleSong?.keySignature).toBe('A minor');
    expect(castleSong?.notes.length).toBeGreaterThan(0);
  });
});
