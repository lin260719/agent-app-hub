import type { ToolDefinition, AgentAppManifest } from '../../agent/types/agent';
import { BlogArticleWriterPage } from './BlogArticleWriterPage';

const systemPrompt = `你是一位專業的「Blog Article Writer (AI 專題部落格作家)」，專精於協助創作者完成高品質專題文章的創作、多模態 AIGC 媒體素材規劃（圖片與影片生成），以及最終獨立單頁 HTML 網頁的視覺設計與排版。

【核心工作機制與權限共享】
本應用採用單一工作區 (Unified Workspace)，包含四個獨立的編輯區塊：
1. **Meta 編輯器**（主題、標題、副標題、關鍵字、議題描述、視覺風格與配色）
2. **文章編輯器 (Markdown)**（文章內文與 AIGC 媒體 Prompt 規劃）
3. **媒體視圖 (Media Manager)**（生成與管理圖片/影片素材）
4. **HTML 編輯器與預覽**（最終獨立單頁 HTML 程式碼與即時預覽）

使用者與你擁有同等權限，可隨時手動編輯此四個區域。你可以透過呼叫工具讀取與寫入此四個區域。

【階段確認原則 (Gate Confirmation) — 極重要】
創作流程分為 4 個階段。**預設情況下，你在完成每一個階段的任務後，必須暫停對話，向使用者回報進度並等待使用者確認同意，才能繼續進入下一個階段。**
除非使用者在對話中明確下達「一次全部完成」或「自動執行到底」的指令，否則嚴禁自行連續執行下一個階段！

【4 階段創作 SOP 規範】

■ 步驟一：Meta 設定 (Stage 1)
- 與使用者討論主題方向與綱要。
- 定義完整 Meta 資料：標題 (title)、副標題 (subtitle)、關鍵字 (keywords)、議題描述 (topicDescription) 以及視覺風格指引 (visualStyleGuideline, 包括建議配色與字體 style)。
- 呼叫 \`update_meta\` 工具寫入「Meta 編輯器」。
- **暫停並向使用者確認**「Meta 設定已完成，請問是否滿意？是否繼續進行步驟二 Markdown 文章撰寫？」

■ 步驟二：Markdown 文章撰寫與提示詞規劃 (Stage 2)
- 讀取 Meta 設定，呼叫 \`update_markdown\` 在「文章編輯器」中撰寫完整 Markdown 文章。
- 評估文章所需的圖片與影片位置，直接在 Markdown 內文中插入明確的媒體說明與 AIGC 提示詞（Prompt），例如：
  \`![AIGC Image Prompt: Modern AI datacenter with blue neon lighting, 16:9](placeholder_1)\`
  \`[AIGC Video Prompt: Drone shot over futuristic smart city, 8s, 16:9](placeholder_vid_1)\`
- **暫停並向使用者確認**「Markdown 文章與媒體提示詞規劃已完成，請問是否開始生成媒體素材 (步驟三)？」

■ 步驟三：媒體素材生成 (Stage 3)
- 根據 Markdown 中的規劃，呼叫 \`generate_media\` 工具生成所需素材（支援 txt2img, img2img, text2video, img2video-ref, img2video-keyframes, img2video-combo）。
- 素材將寫入「媒體視圖」。
- **暫停並向使用者確認**「媒體素材已成功生成並存入媒體庫，請問是否開始整合產出最終 HTML 網頁 (步驟四)？」

■ 步骤四：高品質 HTML 整合與生成 (Stage 4)
- 將 Meta 資料、Markdown 內文與生成的媒體素材 URL 進行最終整合，轉化為單一獨立 HTML 網頁。
- 呼叫 \`update_html\` 寫入「HTML 編輯器」。
- **HTML 寫作嚴格規範**：
  1. **色彩與風格尊重**：絕不可強制設定全黑或突兀背景，必須尊重專案與視覺風格指引的色彩調性，保持視覺舒適一致。
  2. **獨立單頁架構 (Self-contained)**：必須包含完整的 \`<!DOCTYPE html>\`, \`<head>\`, \`<style>\`, \`<body>\`，將所有排版 CSS 與腳本內嵌，不可假設任何外部連結。
  3. **現代 UI/UX 設計指引**：適當的排版與字型邊距 (Typography & Whitespace)、現代卡片容器、首字放大 (Drop Cap)、精美 Blockquote、RWD 響應式佈局、平滑過渡。
- 告知使用者已完成排版，可在 HTML 編輯器分頁中進行全螢幕預覽或一鍵複製。

【工具呼叫】
你可以使用 \`get_workspace_state\`, \`update_meta\`, \`update_markdown\`, \`generate_media\`, \`update_html\` 工具。`;

const tools: ToolDefinition[] = [
  {
    name: 'get_workspace_state',
    description: '取得當前工作區與文章的完整狀態（包含 Meta、Markdown 文章、媒體素材與 HTML 代碼）。在修改任何區塊前應先呼叫此工具。',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'update_meta',
    description: '更新當前文章的 Meta 設定（標題、副標題、關鍵字、議題描述與視覺風格指引）。完成 Stage 1 時呼叫。',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: '文章標題' },
        subtitle: { type: 'STRING', description: '文章副標題' },
        topic: { type: 'STRING', description: '主題/議題分類' },
        keywords: { type: 'ARRAY', items: { type: 'STRING' }, description: '關鍵字列表' },
        topicDescription: { type: 'STRING', description: '議題深度描述與切入點' },
        visualStyleGuideline: { type: 'STRING', description: '視覺風格指引與配色規範' },
        primaryColor: { type: 'STRING', description: '主題主色色號 (如 #3b82f6)' },
        themeMode: { type: 'STRING', enum: ['light', 'dark', 'auto'], description: '主題模式' },
      },
      required: ['title', 'topicDescription'],
    },
  },
  {
    name: 'update_markdown',
    description: '更新當前文章的 Markdown 內文與媒體 Prompt 規劃。完成 Stage 2 時呼叫。',
    parameters: {
      type: 'OBJECT',
      properties: {
        content: { type: 'STRING', description: '包含內文與 AIGC Prompt 的完整 Markdown 文字' },
      },
      required: ['content'],
    },
  },
  {
    name: 'generate_media',
    description: '呼叫多模態媒體生成工具（txt2img, img2img, text2video, img2video 各式模式），產出圖片或短影片並寫入媒體視圖。完成 Stage 3 時呼叫。',
    parameters: {
      type: 'OBJECT',
      properties: {
        mode: {
          type: 'STRING',
          enum: ['txt2img', 'img2img', 'text2video', 'img2video-ref', 'img2video-keyframes', 'img2video-combo'],
          description: '生成模式',
        },
        prompt: { type: 'STRING', description: 'AIGC 提示詞' },
        aspectRatio: {
          type: 'STRING',
          enum: ['1:1', '16:9', '9:16', '4:3', '3:4'],
          description: '長寬比例',
        },
        referenceImageUrls: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: '參考圖片 URL 或 base64 (用於 img2img / img2video-ref / combo)',
        },
        startFrameUrl: { type: 'STRING', description: '起始畫格圖片 URL 或 base64 (用於 keyframes / combo)' },
        endFrameUrl: { type: 'STRING', description: '結束畫格圖片 URL 或 base64 (用於 keyframes / combo)' },
        durationSeconds: { type: 'NUMBER', description: '影片長度秒數 (如 8 秒)' },
        alt: { type: 'STRING', description: '媒體替代說明文字' },
      },
      required: ['mode', 'prompt'],
    },
  },
  {
    name: 'update_html',
    description: '更新當前文章的最終獨立單頁 HTML 代碼與排版。完成 Stage 4 時呼叫。',
    parameters: {
      type: 'OBJECT',
      properties: {
        html: { type: 'STRING', description: '獨立完整的 HTML 原始碼 (含 <!DOCTYPE html>, style, body)' },
      },
      required: ['html'],
    },
  },
];

export const class12BlogArticleWriterManifest: AgentAppManifest = {
  agentAppId: 'class12-blog-article-writer',
  agentAppName: 'Blog Article Writer (AI 專題部落格作家)',
  description: '單一工作區 AI 部落格寫手。結合 Meta 設定、Markdown 撰寫、全方位 Gemini 多模態媒體生成（圖片/短影片）與現代化 HTML 單頁排版。',
  route: '/app/class12-blog-article-writer',
  systemPrompt,
  availableTools: tools,
  MainView: BlogArticleWriterPage,
  icon: '✍️',
  category: '寫作與媒體產出',
  appVersion: '1.0.0',
  sortOrder: 12,
  fullPage: true,
  exampleQuestions: [
    '請幫我撰寫一篇關於「2026 AI 代理人進化與自主工作流程」的深度專題文章。',
    '我想寫一篇「永續綠建築與低碳城市設計」的部落格報導，請先幫我規劃 Meta 與大綱。',
    '請根據目前的 Markdown 內容，為每個段落規劃圖片與 8 秒短影片提示詞，並進行媒體生成。',
    '請幫我將目前的文章與素材整合成精美現代的 HTML 單頁網頁。',
  ],
};
