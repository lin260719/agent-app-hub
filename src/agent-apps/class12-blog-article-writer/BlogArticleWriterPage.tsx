import React, { useState, useEffect, useRef, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { useAgent } from '../../agent/hooks/useAgent';
import { marked } from 'marked';
import type { BlogArticle, ArticleMeta, MediaAsset, MediaAssetMode, StageNumber } from './types';
import { generateMediaAsset, type GenerateMediaOptions } from './services/mediaService';
import {
  saveMediaBlob,
  getMediaBlob,
  deleteMediaBlob,
  safeSaveArticlesToLocalStorage,
} from './services/storageService';

const STORAGE_KEY_ARTICLES = 'class12_blog_articles';
const STORAGE_KEY_ACTIVE_ID = 'class12_active_article_id';

const DEFAULT_META: ArticleMeta = {
  topic: '科技與 AI 趨勢',
  keywords: ['AI 代理人', '自動化工作流', '2026 科技趨勢', '未來寫作'],
  topicDescription: '探討 2026 年生成式 AI 與 AI Agent 重新定義個人創作者與企業工作流程的關鍵變革。',
  visualStyleGuideline: '極簡現代科技風 (Modern Clean Tech)。背景採用質感淺灰/純白，配以深藍 (#1e3a8a) 與極光青 (#06b6d4) 作為主要輔助色，搭配現代無襯線字型與卡片式留白排版。',
  primaryColor: '#1e3a8a',
  themeMode: 'light',
};

const DEFAULT_ARTICLE_CONTENT = `# 2026 AI 代理人革命：從對話框走向自主工作流程的未來

在過去幾年中，人工智慧的發展經歷了從簡單問答到複雜任務協作的重大轉型。進入 2026 年，**AI 代理人 (AI Agents)** 已不再只是回答問題的聊天機器人，而是成為具備目標拆解、工具調用與多模態產出的全方位數位夥伴。

![AIGC Image Prompt: High-tech futuristic workspace with translucent AI visual overlays and clean modern design, 16:9](placeholder_cover)

## 一、從「輸入指令」到「目標驅動」

傳統的生成式 AI 依賴使用者精準的提示詞（Prompt engineering），而現代 AI 代理人則具備了以下四大核心能力：

1. **目標理解與拆解**：能自動將複雜指令拆解為具體的子任務與階段性檢查點。
2. **多模態工具鏈整合**：自動調用 txt2img、img2video 等 API 生成高品質圖像與動態短影音。
3. **即時檢索與實證分析**：連結網路實時搜尋，確保內容資料的客觀性與權威性。
4. **獨立單頁視覺構建**：將文字、數據與媒體素材自動轉化為具備現代 UI/UX 的視覺網頁。

[AIGC Video Prompt: Cinematic camera move through a futuristic neon glowing data network, 8s, 16:9](placeholder_video)

## 二、圖文影音全方位整合的新創作模式

對內容創作者而言，單一工作區（Unified Workspace）的出現大幅降低了跨平台工具切換的摩擦力。創作者只需專注於策略設定與價值審查，視覺與多媒體的算力產出交由 Agent 全權處理。

> 「未來的內容創作不是人被 AI 取代，而是善用 AI 代理人串聯多模態素材的人，徹底重塑了創作效率與視覺標竿。」

---
*本文由 Blog Article Writer AI 專題部落格作家協助構思與繪製。*`;

const DEFAULT_HTML_TEMPLATE = (title: string, subtitle: string, contentHtml: string) => `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    :root {
      --primary-color: #1e3a8a;
      --accent-color: #06b6d4;
      --bg-color: #f8fafc;
      --card-bg: #ffffff;
      --text-main: #0f172a;
      --text-muted: #475569;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-main);
      line-height: 1.8;
      padding: 2rem 1rem;
    }
    .container {
      max-width: 860px;
      margin: 0 auto;
      background: var(--card-bg);
      padding: 3rem 2.5rem;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
    }
    header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 2rem;
      margin-bottom: 2.5rem;
      text-align: center;
    }
    h1 {
      font-size: 2.4rem;
      color: var(--primary-color);
      letter-spacing: -0.02em;
      margin-bottom: 0.75rem;
      line-height: 1.25;
    }
    .subtitle {
      font-size: 1.25rem;
      color: var(--text-muted);
      font-weight: 400;
    }
    .content h2 {
      font-size: 1.6rem;
      color: var(--primary-color);
      margin-top: 2rem;
      margin-bottom: 1rem;
      border-left: 4px solid var(--accent-color);
      padding-left: 0.75rem;
    }
    .content p {
      margin-bottom: 1.25rem;
      font-size: 1.05rem;
    }
    .content blockquote {
      background: #f1f5f9;
      border-left: 4px solid var(--primary-color);
      margin: 1.5rem 0;
      padding: 1rem 1.25rem;
      font-style: italic;
      color: #334155;
      border-radius: 0 8px 8px 0;
    }
    .content img, .content video {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      margin: 1.5rem 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      display: block;
    }
    footer {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #94a3b8;
      font-size: 0.9rem;
    }
    @media (max-width: 640px) {
      .container { padding: 1.5rem 1.25rem; }
      h1 { font-size: 1.8rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${title}</h1>
      ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
    </header>
    <main class="content">
      ${contentHtml}
    </main>
    <footer>
      <p>© 2026 Blog Article Writer • All Rights Reserved</p>
    </footer>
  </div>
</body>
</html>`;

// React Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class BlogArticleWriterErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('BlogArticleWriterErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_ARTICLES);
      localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
    } catch (e) {
      console.error(e);
    }
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900 text-slate-100 p-8 text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold text-slate-100">頁面渲染發生異常</h2>
          <p className="text-sm text-slate-400 max-w-md">
            {this.state.error?.message || '發生未預期的系統錯誤。這可能是由於快取過大或儲存配額限制導致。'}
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg transition"
            >
              🔄 嘗試重新渲染
            </button>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow transition"
            >
              🗑️ 重置工作區與快取
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const BlogArticleWriterInner: React.FC = () => {
  const { registerToolHandlers, settings } = useAgent();

  // --- Article Store State ---
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [activeArticleId, setActiveArticleId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'meta' | 'markdown' | 'media' | 'html'>('meta');

  // --- Editor States ---
  const [htmlViewMode, setHtmlViewMode] = useState<'preview' | 'code'>('preview');
  const [iframeViewport, setIframeViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // --- Media Generator Form State ---
  const [genMode, setGenMode] = useState<MediaAssetMode>('txt2img');
  const [genPrompt, setGenPrompt] = useState('');
  const [genAspect, setGenAspect] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('16:9');
  const [genRefUrls, setGenRefUrls] = useState<string[]>([]);
  const [genStartFrame, setGenStartFrame] = useState('');
  const [genEndFrame, setGenEndFrame] = useState('');
  const [genDuration, setGenDuration] = useState<number>(8);
  const [isGeneratingMedia, setIsGeneratingMedia] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Load from localStorage on mount & resolve IndexedDB media assets
  useEffect(() => {
    const loadStore = async () => {
      try {
        const storedArticles = localStorage.getItem(STORAGE_KEY_ARTICLES);
        const storedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
        let parsedArticles: BlogArticle[] = storedArticles ? JSON.parse(storedArticles) : [];

        if (parsedArticles.length === 0) {
          const initialArticle: BlogArticle = {
            id: 'art_' + Date.now(),
            title: '2026 AI 代理人革命：從對話框走向自主工作流程的未來',
            subtitle: '單一工作區與多模態素材生成如何重塑創作者生態',
            stage: 1,
            meta: DEFAULT_META,
            content: DEFAULT_ARTICLE_CONTENT,
            mediaAssets: [],
            html: DEFAULT_HTML_TEMPLATE(
              '2026 AI 代理人革命：從對話框走向自主工作流程的未來',
              '單一工作區與多模態素材生成如何重塑創作者生態',
              String(marked(DEFAULT_ARTICLE_CONTENT))
            ),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          parsedArticles = [initialArticle];
          safeSaveArticlesToLocalStorage(STORAGE_KEY_ARTICLES, parsedArticles);
          try {
            localStorage.setItem(STORAGE_KEY_ACTIVE_ID, initialArticle.id);
          } catch (e) {
            console.warn(e);
          }
        }

        // Resolve any IndexedDB media references
        const resolvedArticles = await Promise.all(
          parsedArticles.map(async (art) => {
            const resolvedAssets = await Promise.all(
              art.mediaAssets.map(async (asset) => {
                if (asset.url && asset.url.startsWith('indexeddb://')) {
                  const blobOrUrl = await getMediaBlob(asset.id);
                  if (blobOrUrl) {
                    return { ...asset, url: typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl) };
                  }
                }
                return asset;
              })
            );
            return { ...art, mediaAssets: resolvedAssets };
          })
        );

        setArticles(resolvedArticles);
        setActiveArticleId(
          storedActiveId && resolvedArticles.some((a) => a.id === storedActiveId)
            ? storedActiveId
            : resolvedArticles[0].id
        );
      } catch (e) {
        console.error('Error loading articles:', e);
      }
    };

    loadStore();
  }, []);

  // Save active article ID safely
  useEffect(() => {
    if (activeArticleId) {
      try {
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeArticleId);
      } catch (e) {
        console.warn(e);
      }
    }
  }, [activeArticleId]);

  // Current active article helper
  const activeArticle = articles.find((a) => a.id === activeArticleId) || articles[0];

  // Helper to update active article safely
  const updateActiveArticle = useCallback(
    (updater: (prev: BlogArticle) => BlogArticle) => {
      setArticles((prevArticles) => {
        const nextArticles = prevArticles.map((art) => {
          if (art.id === activeArticleId || (!activeArticleId && art === prevArticles[0])) {
            const updated = updater(art);
            return { ...updated, updatedAt: new Date().toISOString() };
          }
          return art;
        });

        // Safely persist to localStorage
        safeSaveArticlesToLocalStorage(STORAGE_KEY_ARTICLES, nextArticles);
        return nextArticles;
      });
    },
    [activeArticleId]
  );

  // Register Agent Tool Handlers
  useEffect(() => {
    registerToolHandlers({
      get_workspace_state: async () => {
        if (!activeArticle) return { error: '沒有找到活動中的文章' };
        return {
          id: activeArticle.id,
          title: activeArticle.title,
          subtitle: activeArticle.subtitle,
          stage: activeArticle.stage,
          meta: activeArticle.meta,
          content: activeArticle.content,
          mediaAssetsCount: activeArticle.mediaAssets.length,
          mediaAssets: activeArticle.mediaAssets.map((m) => ({
            id: m.id,
            type: m.type,
            mode: m.mode,
            prompt: m.prompt,
            url: m.url.substring(0, 50) + '...',
          })),
          htmlLength: activeArticle.html ? activeArticle.html.length : 0,
        };
      },

      update_meta: async (args: Partial<ArticleMeta> & { title?: string; subtitle?: string }) => {
        updateActiveArticle((art) => {
          const updatedMeta: ArticleMeta = {
            ...art.meta,
            topic: args.topic ?? art.meta.topic,
            keywords: args.keywords ?? art.meta.keywords,
            topicDescription: args.topicDescription ?? art.meta.topicDescription,
            visualStyleGuideline: args.visualStyleGuideline ?? art.meta.visualStyleGuideline,
            primaryColor: args.primaryColor ?? art.meta.primaryColor,
            themeMode: args.themeMode ?? art.meta.themeMode,
          };

          return {
            ...art,
            title: args.title ?? art.title,
            subtitle: args.subtitle ?? art.subtitle,
            meta: updatedMeta,
            stage: 1,
          };
        });
        return { success: true, message: 'Meta 編輯器已成功更新。已定位至 Stage 1。' };
      },

      update_markdown: async (args: { content: string }) => {
        updateActiveArticle((art) => {
          const htmlContent = String(marked(args.content || ''));
          const updatedHtml = DEFAULT_HTML_TEMPLATE(art.title, art.subtitle, htmlContent);

          return {
            ...art,
            content: args.content,
            html: updatedHtml,
            stage: 2,
          };
        });
        return { success: true, message: 'Markdown 文章編輯器已更新。已定位至 Stage 2。' };
      },

      generate_media: async (args: GenerateMediaOptions) => {
        try {
          const apiKey = settings.apiKey || '';
          const asset = await generateMediaAsset(args, apiKey);
          updateActiveArticle((art) => ({
            ...art,
            mediaAssets: [asset, ...art.mediaAssets],
            stage: 3,
          }));
          return {
            success: true,
            assetId: asset.id,
            type: asset.type,
            url: `indexeddb://${asset.id}`,
            message: `成功生成 ${asset.type === 'image' ? '圖片' : '短影片'}素材 (ID: ${asset.id})！已新增至媒體視圖。`,
          };
        } catch (err: any) {
          return { success: false, error: err.message || '媒體生成失敗' };
        }
      },

      update_html: async (args: { html: string }) => {
        updateActiveArticle((art) => ({
          ...art,
          html: args.html,
          stage: 4,
        }));
        return { success: true, message: 'HTML 編輯器已成功更新獨立單頁程式碼。已定位至 Stage 4。' };
      },
    });
  }, [activeArticle, updateActiveArticle, registerToolHandlers, settings.apiKey]);

  // Document Management Handlers
  const handleCreateNewArticle = () => {
    const newArt: BlogArticle = {
      id: 'art_' + Date.now(),
      title: '未命名專題文章',
      subtitle: '請輸入副標題',
      stage: 1,
      meta: { ...DEFAULT_META, topic: '新主題' },
      content: '# 請開始撰寫文章內容...\n\n',
      mediaAssets: [],
      html: DEFAULT_HTML_TEMPLATE('未命名專題文章', '請輸入副標題', '<p>請開始撰寫文章內容...</p>'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const nextArticles = [newArt, ...articles];
    setArticles(nextArticles);
    setActiveArticleId(newArt.id);
    safeSaveArticlesToLocalStorage(STORAGE_KEY_ARTICLES, nextArticles);
  };

  const handleDeleteArticle = (id: string) => {
    if (articles.length <= 1) {
      alert('請至少保留一篇文章。');
      return;
    }
    if (!window.confirm('確定要刪除這篇文章嗎？此動作無法復原。')) return;

    const remaining = articles.filter((a) => a.id !== id);
    setArticles(remaining);
    setActiveArticleId(remaining[0].id);
    safeSaveArticlesToLocalStorage(STORAGE_KEY_ARTICLES, remaining);
  };

  const handleRenameArticle = (id: string) => {
    const art = articles.find((a) => a.id === id);
    if (!art) return;
    const newTitle = prompt('修改文章標題：', art.title);
    if (newTitle && newTitle.trim()) {
      updateActiveArticle((prev) => ({ ...prev, title: newTitle.trim() }));
    }
  };

  // Manual Media Generation Handler
  const handleManualGenerateMedia = async () => {
    setGenError(null);
    setIsGeneratingMedia(true);
    try {
      const apiKey = settings.apiKey || '';
      const options: GenerateMediaOptions = {
        mode: genMode,
        prompt: genPrompt,
        aspectRatio: genAspect,
        referenceImageUrls: genRefUrls.filter((u) => u.trim().length > 0),
        startFrameUrl: genStartFrame || undefined,
        endFrameUrl: genEndFrame || undefined,
        durationSeconds: genDuration,
      };

      const asset = await generateMediaAsset(options, apiKey);
      updateActiveArticle((art) => ({
        ...art,
        mediaAssets: [asset, ...art.mediaAssets],
      }));
      setGenPrompt('');
    } catch (e: any) {
      setGenError(e.message || '生成過程發生錯誤');
    } finally {
      setIsGeneratingMedia(false);
    }
  };

  // Copy HTML to Clipboard
  const handleCopyHtml = () => {
    if (!activeArticle?.html) return;
    navigator.clipboard.writeText(activeArticle.html);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // Download HTML file
  const handleDownloadHtml = () => {
    if (!activeArticle?.html) return;
    const blob = new Blob([activeArticle.html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeArticle.title || 'article'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!activeArticle) return null;

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation & Dashboard Header */}
      <header className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 gap-3">
        {/* Document Selector & App Name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-1.5 rounded-lg font-bold text-white text-sm shadow">
            <span>✍️</span>
            <span>Blog Article Writer</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1">
            <span className="text-xs text-slate-400">文章：</span>
            <select
              value={activeArticle.id}
              onChange={(e) => setActiveArticleId(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer max-w-[200px] truncate"
            >
              {articles.map((art) => (
                <option key={art.id} value={art.id} className="bg-slate-900 text-slate-200">
                  {art.title || '未命名文章'}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCreateNewArticle}
            className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-slate-200 flex items-center gap-1 transition"
            title="新增文章"
          >
            <span>+</span> 新增文章
          </button>
          <button
            onClick={() => handleRenameArticle(activeArticle.id)}
            className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-slate-300 transition"
            title="重新命名"
          >
            ✏️ 重命名
          </button>
          <button
            onClick={() => handleDeleteArticle(activeArticle.id)}
            className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-red-900/50 border border-slate-700 hover:border-red-700 rounded-md text-red-300 transition"
            title="刪除文章"
          >
            🗑️ 刪除
          </button>
        </div>

        {/* Stage Stepper Indicator */}
        <div className="flex items-center gap-1 bg-slate-900 px-3 py-1 rounded-full border border-slate-800 text-xs">
          <span className="text-slate-400 font-semibold mr-1">進度：</span>
          {[
            { stage: 1, label: '1. Meta 設定' },
            { stage: 2, label: '2. Markdown' },
            { stage: 3, label: '3. 媒體生成' },
            { stage: 4, label: '4. HTML 整合' },
          ].map((s) => {
            const isActive = activeArticle.stage === s.stage;
            const isPassed = activeArticle.stage > s.stage;
            return (
              <button
                key={s.stage}
                onClick={() => updateActiveArticle((a) => ({ ...a, stage: s.stage as StageNumber }))}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow'
                    : isPassed
                    ? 'bg-slate-800 text-blue-400 hover:bg-slate-700'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Tab Navigation Bar */}
      <div className="flex items-center px-4 bg-slate-950/80 border-b border-slate-800 gap-1 text-sm font-medium">
        <button
          onClick={() => setActiveTab('meta')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition ${
            activeTab === 'meta'
              ? 'border-blue-500 text-blue-400 font-semibold bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <span>📋</span> Meta 編輯器
        </button>
        <button
          onClick={() => setActiveTab('markdown')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition ${
            activeTab === 'markdown'
              ? 'border-blue-500 text-blue-400 font-semibold bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <span>📝</span> 文章編輯器 (Markdown)
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition ${
            activeTab === 'media'
              ? 'border-blue-500 text-blue-400 font-semibold bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <span>🖼️</span> 媒體視圖 ({activeArticle.mediaAssets.length})
        </button>
        <button
          onClick={() => setActiveTab('html')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition ${
            activeTab === 'html'
              ? 'border-blue-500 text-blue-400 font-semibold bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <span>🌐</span> HTML 編輯器與預覽
        </button>
      </div>

      {/* Main Content Workspace Area */}
      <div className="flex-1 overflow-auto bg-slate-900 p-4">
        {/* TAB 1: META EDITOR */}
        {activeTab === 'meta' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>📋</span> 專題 Meta 設定與視覺指引 (Stage 1)
                </h2>
                <span className="text-xs bg-blue-900/50 text-blue-300 border border-blue-700/50 px-2.5 py-1 rounded">
                  使用者與 Agent 共享最高編輯權限
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">主標題 (Title)</label>
                  <input
                    type="text"
                    value={activeArticle.title}
                    onChange={(e) => updateActiveArticle((a) => ({ ...a, title: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                    placeholder="請輸入文章主標題"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">副標題 (Subtitle)</label>
                  <input
                    type="text"
                    value={activeArticle.subtitle}
                    onChange={(e) => updateActiveArticle((a) => ({ ...a, subtitle: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                    placeholder="請輸入副標題"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">議題分類 (Topic)</label>
                  <input
                    type="text"
                    value={activeArticle.meta.topic}
                    onChange={(e) =>
                      updateActiveArticle((a) => ({ ...a, meta: { ...a.meta, topic: e.target.value } }))
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    關鍵字 (Keywords, 以逗號分隔)
                  </label>
                  <input
                    type="text"
                    value={activeArticle.meta.keywords.join(', ')}
                    onChange={(e) =>
                      updateActiveArticle((a) => ({
                        ...a,
                        meta: { ...a.meta, keywords: e.target.value.split(',').map((k) => k.trim()) },
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">議題深度描述 (Topic Description)</label>
                <textarea
                  rows={3}
                  value={activeArticle.meta.topicDescription}
                  onChange={(e) =>
                    updateActiveArticle((a) => ({ ...a, meta: { ...a.meta, topicDescription: e.target.value } }))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  視覺風格與 HTML 排版規範 (Visual Style Guideline)
                </label>
                <textarea
                  rows={3}
                  value={activeArticle.meta.visualStyleGuideline}
                  onChange={(e) =>
                    updateActiveArticle((a) => ({
                      ...a,
                      meta: { ...a.meta, visualStyleGuideline: e.target.value },
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  placeholder="包含 CSS 配色、卡片風或社論風格描述"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MARKDOWN EDITOR */}
        {activeTab === 'markdown' && (
          <div className="h-full flex flex-col md:flex-row gap-4 max-w-7xl mx-auto">
            {/* Editor Input */}
            <div className="flex-1 flex flex-col bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <span>📝</span> Markdown 原始碼與 AIGC 提示詞
                </span>
                <span className="text-xs text-slate-400">
                  字數：{activeArticle.content.length} 字
                </span>
              </div>
              <textarea
                value={activeArticle.content}
                onChange={(e) => {
                  const val = e.target.value;
                  updateActiveArticle((a) => ({
                    ...a,
                    content: val,
                    html: DEFAULT_HTML_TEMPLATE(a.title, a.subtitle, String(marked(val))),
                  }));
                }}
                className="flex-1 w-full bg-slate-950 p-4 text-sm font-mono text-slate-200 focus:outline-none resize-none leading-relaxed"
                placeholder="輸入 Markdown 內容與 AIGC 提示詞..."
              />
            </div>

            {/* Markdown Live Preview */}
            <div className="flex-1 flex flex-col bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
              <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span>👁️</span> Markdown 即時預覽
              </div>
              <div
                className="flex-1 p-6 overflow-auto prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: String(marked(activeArticle.content)) }}
              />
            </div>
          </div>
        )}

        {/* TAB 3: MEDIA MANAGER */}
        {activeTab === 'media' && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Gemini Media Generation Panel */}
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>✨</span> Gemini 多模態素材生成工具 (txt2img, img2img, text2video, img2video)
                </h2>
                {!settings.apiKey && (
                  <span className="text-xs text-amber-400 bg-amber-950/60 border border-amber-700/50 px-2 py-1 rounded">
                    ⚠️ 未設定 Gemini API Key (請於畫面右下角設定)
                  </span>
                )}
              </div>

              {genError && (
                <div className="p-3 bg-red-950/70 border border-red-800 text-red-200 rounded-lg text-xs">
                  {genError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">生成模式</label>
                  <select
                    value={genMode}
                    onChange={(e) => setGenMode(e.target.value as MediaAssetMode)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="txt2img">🎨 txt2img (文字生成圖片)</option>
                    <option value="img2img">🖼️ img2img (圖片參考生成圖)</option>
                    <option value="text2video">🎥 text2video (文字生成 8s 短影音)</option>
                    <option value="img2video-ref">📹 img2video-ref (參考圖生成影片)</option>
                    <option value="img2video-keyframes">🎞️ img2video-keyframes (起始/結束畫格影片)</option>
                    <option value="img2video-combo">🎬 img2video-combo (畫格與角色組合生成)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">長寬比例 (Aspect Ratio)</label>
                  <select
                    value={genAspect}
                    onChange={(e) => setGenAspect(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="16:9">16:9 橫式 (社論/影片首選)</option>
                    <option value="1:1">1:1 正方形 (社聯貼文)</option>
                    <option value="9:16">9:16 直式 (短影音/手機)</option>
                    <option value="4:3">4:3 標準照片</option>
                    <option value="3:4">3:4 直式照片</option>
                  </select>
                </div>

                {genMode.includes('video') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">影片長度 (秒)</label>
                    <input
                      type="number"
                      value={genDuration}
                      onChange={(e) => setGenDuration(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">AIGC 提示詞 (Prompt)</label>
                <textarea
                  rows={2}
                  value={genPrompt}
                  onChange={(e) => setGenPrompt(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  placeholder="詳細描述欲生成的圖片或動態場景風格..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleManualGenerateMedia}
                  disabled={isGeneratingMedia || !genPrompt.trim()}
                  className={`px-5 py-2 rounded-lg font-bold text-sm text-white transition flex items-center gap-2 ${
                    isGeneratingMedia || !genPrompt.trim()
                      ? 'bg-slate-700 cursor-not-allowed text-slate-400'
                      : 'bg-blue-600 hover:bg-blue-500 shadow-lg'
                  }`}
                >
                  {isGeneratingMedia ? <span>⏳ 生成中...</span> : <span>🚀 呼叫 Gemini 產出素材</span>}
                </button>
              </div>
            </div>

            {/* Generated Assets Gallery */}
            <div className="space-y-4">
              <h3 className="text-md font-bold text-slate-200 flex items-center gap-2">
                <span>📚</span> 已產出素材庫 ({activeArticle.mediaAssets.length})
              </h3>
              {activeArticle.mediaAssets.length === 0 ? (
                <div className="bg-slate-950/60 p-8 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-sm">
                  尚無生成的媒體素材。您可以利用上方工具生成，或由 Agent 自動建立。
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeArticle.mediaAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-md flex flex-col"
                    >
                      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                        {asset.type === 'image' ? (
                          <img src={asset.url} alt={asset.alt} className="w-full h-full object-cover" />
                        ) : (
                          <video src={asset.url} controls className="w-full h-full object-cover" />
                        )}
                        <span className="absolute top-2 left-2 bg-slate-900/80 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                          {asset.mode}
                        </span>
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                        <p className="text-xs text-slate-300 line-clamp-2">{asset.prompt}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                          <span>{asset.aspectRatio || '16:9'}</span>
                          <button
                            onClick={() => {
                              deleteMediaBlob(asset.id);
                              updateActiveArticle((art) => ({
                                ...art,
                                mediaAssets: art.mediaAssets.filter((m) => m.id !== asset.id),
                              }));
                            }}
                            className="text-red-400 hover:underline"
                          >
                            刪除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: HTML EDITOR & LIVE PREVIEW */}
        {activeTab === 'html' && (
          <div className="h-full flex flex-col max-w-7xl mx-auto space-y-3">
            {/* HTML Controls Header */}
            <div className="flex flex-wrap items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHtmlViewMode('preview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    htmlViewMode === 'preview'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  👁️ 即時 Iframe 預覽
                </button>
                <button
                  onClick={() => setHtmlViewMode('code')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    htmlViewMode === 'code'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  💻 HTML 原始碼編輯
                </button>
              </div>

              {htmlViewMode === 'preview' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">尺寸：</span>
                  <button
                    onClick={() => setIframeViewport('desktop')}
                    className={`px-2.5 py-1 rounded text-xs transition ${
                      iframeViewport === 'desktop' ? 'bg-slate-800 text-blue-400 font-bold' : 'text-slate-400'
                    }`}
                  >
                    💻 桌面
                  </button>
                  <button
                    onClick={() => setIframeViewport('mobile')}
                    className={`px-2.5 py-1 rounded text-xs transition ${
                      iframeViewport === 'mobile' ? 'bg-slate-800 text-blue-400 font-bold' : 'text-slate-400'
                    }`}
                  >
                    📱 手機
                  </button>
                  <button
                    onClick={() => setIsFullscreenPreview(!isFullscreenPreview)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition"
                  >
                    {isFullscreenPreview ? '❌ 退出全螢幕' : '⛶ 全螢幕預覽'}
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyHtml}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                >
                  {copiedNotification ? <span>✅ 已複製！</span> : <span>📋 一鍵複製 HTML</span>}
                </button>
                <button
                  onClick={handleDownloadHtml}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"
                >
                  <span>⬇️</span> 下載 HTML 檔
                </button>
              </div>
            </div>

            {/* Content View */}
            <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col min-h-[500px]">
              {htmlViewMode === 'preview' ? (
                <div
                  className={`flex-1 flex justify-center bg-slate-950 p-4 overflow-auto transition-all ${
                    isFullscreenPreview ? 'fixed inset-0 z-50 p-6 bg-slate-950' : ''
                  }`}
                >
                  <iframe
                    title="Article Live Preview"
                    srcDoc={activeArticle.html}
                    className={`bg-white rounded-xl shadow-2xl transition-all ${
                      iframeViewport === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full h-full max-w-4xl'
                    }`}
                  />
                </div>
              ) : (
                <textarea
                  value={activeArticle.html}
                  onChange={(e) => updateActiveArticle((a) => ({ ...a, html: e.target.value }))}
                  className="flex-1 w-full bg-slate-950 p-4 text-xs font-mono text-slate-200 focus:outline-none resize-none leading-relaxed"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const BlogArticleWriterPage: React.FC = () => {
  return (
    <BlogArticleWriterErrorBoundary>
      <BlogArticleWriterInner />
    </BlogArticleWriterErrorBoundary>
  );
};

export default BlogArticleWriterPage;
