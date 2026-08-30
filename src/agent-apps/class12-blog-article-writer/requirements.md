# Requirements — class12-blog-article-writer (Blog Article Writer AI 專題部落格作家)

本專案開發一個單一工作區（Unified Workspace）Agent 應用程式「Blog Article Writer (AI 專題部落格作家)」，協助創作者進行議題設定、Markdown 文章撰寫、高品質 AIGC 媒體素材生成（圖片與影音），以及具備現代 UI/UX 設計的獨立單頁 HTML 排版。

---

## 1. 核心架構與互動機制

1. **單一工作區 (Unified Workspace) 與分頁 (Tab View) 原則**：
   - 介面固定採用分頁檢視（Tab View），將 4 個獨立編輯器與視圖作為全尺寸分頁切換，並搭配頂部儀表板 (Dashboard) 進行文章新增/切換/重命名與刪除。
   - 4 個分頁：
     - **Tab 1: Meta 編輯器 (Meta Editor)**
     - **Tab 2: 文章編輯器 (Markdown Editor)**
     - **Tab 3: 媒體視圖 / 媒體管理工具 (Media Manager)**
     - **Tab 4: HTML 編輯器與預覽 (HTML Editor & Live Preview)**
2. **權限對等與共享**：
   - 使用者可隨時手動修改 4 個區域的內容。
   - Agent 透過工具完全讀取與寫入 4 個區域。
3. **階段確認原則 (Gate Confirmation)**：
   - 預設分為 4 階段：
     - 步驟一：Meta 設定 (Stage 1)
     - 步驟二：Markdown 文章撰寫與提示詞規劃 (Stage 2)
     - 步驟三：媒體素材生成 (Stage 3)
     - 步驟四：高品質 HTML 整合與生成 (Stage 4)
   - Agent 在完成每一個階段後，預設必須暫停並等待使用者確認同意，才能進入下一階段。除非收到「一次全部完成」的指令。

---

## 2. Agent 規格與 Tool Calling

提供 5 個精細粒度工具：
1. `get_workspace_state`: 取得目前文章全貌。
2. `update_meta`: 更新 Meta 設定 (標題、副標、議題、關鍵字、視覺風格指引)。
3. `update_markdown`: 更新 Markdown 內容與 AIGC Prompt 規劃。
4. `generate_media`: 呼叫 txt2img, img2img, text2video, img2video 等多模態生成工具。
5. `update_html`: 輸出獨立單頁 HTML (含 CSS 樣式、RWD、卡片與影音容器)。
