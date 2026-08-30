export type StageNumber = 1 | 2 | 3 | 4;

export interface ArticleMeta {
  topic: string;
  keywords: string[];
  topicDescription: string;
  visualStyleGuideline: string;
  primaryColor?: string;
  themeMode?: 'light' | 'dark' | 'auto';
}

export type MediaAssetMode = 
  | 'txt2img' 
  | 'img2img' 
  | 'text2video' 
  | 'img2video-ref' 
  | 'img2video-keyframes' 
  | 'img2video-combo';

export interface MediaAsset {
  id: string;
  type: 'image' | 'video';
  mode: MediaAssetMode;
  url: string;
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  referenceImageUrls?: string[];
  startFrameUrl?: string;
  endFrameUrl?: string;
  durationSeconds?: number;
  alt: string;
  createdAt: string;
  isPlaceholder?: boolean;
}

export interface BlogArticle {
  id: string;
  title: string;
  subtitle: string;
  stage: StageNumber;
  meta: ArticleMeta;
  content: string; // Markdown
  mediaAssets: MediaAsset[];
  html: string;
  createdAt: string;
  updatedAt: string;
}
