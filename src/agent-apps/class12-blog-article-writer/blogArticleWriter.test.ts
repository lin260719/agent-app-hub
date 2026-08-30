import { describe, it, expect } from 'vitest';
import { class12BlogArticleWriterManifest } from './agentAppManifest';

describe('Blog Article Writer Agent App Manifest', () => {
  it('should have valid manifest metadata', () => {
    expect(class12BlogArticleWriterManifest.agentAppId).toBe('class12-blog-article-writer');
    expect(class12BlogArticleWriterManifest.agentAppName).toContain('Blog Article Writer');
    expect(class12BlogArticleWriterManifest.route).toBe('/app/class12-blog-article-writer');
    expect(class12BlogArticleWriterManifest.MainView).toBeDefined();
  });

  it('should include all required 5 tools', () => {
    const toolNames = class12BlogArticleWriterManifest.availableTools.map((t) => t.name);
    expect(toolNames).toContain('get_workspace_state');
    expect(toolNames).toContain('update_meta');
    expect(toolNames).toContain('update_markdown');
    expect(toolNames).toContain('generate_media');
    expect(toolNames).toContain('update_html');
  });

  it('should include stage confirmation SOP in system prompt', () => {
    expect(class12BlogArticleWriterManifest.systemPrompt).toContain('階段確認原則');
    expect(class12BlogArticleWriterManifest.systemPrompt).toContain('Stage 1');
    expect(class12BlogArticleWriterManifest.systemPrompt).toContain('Stage 2');
    expect(class12BlogArticleWriterManifest.systemPrompt).toContain('Stage 3');
    expect(class12BlogArticleWriterManifest.systemPrompt).toContain('Stage 4');
  });
});
