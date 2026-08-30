import { createGoogleGenAI } from '../../../shared/auth';
import type { MediaAsset, MediaAssetMode } from '../types';
import { saveMediaBlob } from './storageService';

export interface GenerateMediaOptions {
  mode: MediaAssetMode;
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  referenceImageUrls?: string[];
  startFrameUrl?: string;
  endFrameUrl?: string;
  durationSeconds?: number;
  alt?: string;
}

export const generateMediaAsset = async (
  options: GenerateMediaOptions,
  apiKey: string
): Promise<MediaAsset> => {
  if (!apiKey) {
    throw new Error('未設定 Gemini API Key。請點擊畫面右下角設定按鈕填入 API Key。');
  }

  const ai = createGoogleGenAI(apiKey);
  const isVideo = options.mode.includes('video');
  const aspectRatio = options.aspectRatio || '16:9';
  const assetId = (isVideo ? 'vid_' : 'img_') + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  if (!isVideo) {
    // Image Generation via Gemini generateContent
    const modelName = 'gemini-3.1-flash-image';
    let fullPrompt = options.prompt;
    if (options.mode === 'img2img' && options.referenceImageUrls?.length) {
      fullPrompt += ` (Based on reference style/content from provided image)`;
    }
    fullPrompt += ` Aspect ratio: ${aspectRatio}. High quality editorial blog image.`;

    const contentsArray: any[] = [];

    if (options.referenceImageUrls && options.referenceImageUrls.length > 0) {
      for (const url of options.referenceImageUrls) {
        if (url.startsWith('data:image/')) {
          const parts = url.split(',');
          const mimeMatch = url.match(/data:(.*?);/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const base64Data = parts[1];
          contentsArray.push({
            inlineData: {
              mimeType,
              data: base64Data,
            },
          });
        }
      }
    }
    contentsArray.push(fullPrompt);

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contentsArray,
        config: {
          responseModalities: ['IMAGE'],
        },
      });

      let base64Str = '';
      const candidate = response.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            base64Str = part.inlineData.data;
            break;
          }
        }
      }

      if (!base64Str) {
        throw new Error('Gemini API 未回傳圖片數據，請重試或確認 API 金鑰權限。');
      }

      const mimeType = 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${base64Str}`;

      // Asynchronously persist to IndexedDB
      saveMediaBlob(assetId, dataUrl);

      return {
        id: assetId,
        type: 'image',
        mode: options.mode,
        url: dataUrl,
        prompt: options.prompt,
        aspectRatio,
        referenceImageUrls: options.referenceImageUrls,
        alt: options.alt || options.prompt,
        createdAt: new Date().toISOString(),
      };
    } catch (e: any) {
      console.error('Image generation error:', e);
      throw new Error(`圖片生成失敗: ${e.message || '請檢查 API 金鑰與配額'}`);
    }
  } else {
    // Video Generation using Veo model API
    const candidateModels = ['veo-3.1-generate-preview', 'veo-2.0-generate-001'];
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        let videoPrompt = options.prompt;
        if (options.durationSeconds) {
          videoPrompt += ` Duration: ${options.durationSeconds}s.`;
        }

        const payload: any = {
          model: modelName,
          prompt: videoPrompt,
          config: {
            aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
            numberOfVideos: 1,
          },
        };

        if (options.startFrameUrl && options.startFrameUrl.startsWith('data:image/')) {
          const parts = options.startFrameUrl.split(',');
          payload.config.startFrame = {
            imageBytes: parts[1],
            mimeType: 'image/jpeg',
          };
        }

        if (options.endFrameUrl && options.endFrameUrl.startsWith('data:image/')) {
          const parts = options.endFrameUrl.split(',');
          payload.config.endFrame = {
            imageBytes: parts[1],
            mimeType: 'image/jpeg',
          };
        }

        const operation = await ai.models.generateVideos(payload);

        let videoResult = operation;
        let polls = 0;
        while (!videoResult.done && polls < 30) {
          await new Promise((r) => setTimeout(r, 4000));
          if ((ai as any).operations?.getVideosOperation) {
            videoResult = await (ai as any).operations.getVideosOperation({ operation: videoResult });
          } else if ((ai as any).operations?.get) {
            videoResult = await (ai as any).operations.get({ name: videoResult.name });
          }
          polls++;
        }

        const generatedVideo = videoResult.response?.generatedVideos?.[0];
        let videoUrl = '';
        if (generatedVideo?.video?.videoBytes) {
          videoUrl = `data:video/mp4;base64,${generatedVideo.video.videoBytes}`;
        } else if (generatedVideo?.video?.uri) {
          videoUrl = generatedVideo.video.uri;
        }

        if (!videoUrl) {
          throw new Error('Veo API 未成功產出影片內容。');
        }

        // Asynchronously persist to IndexedDB
        saveMediaBlob(assetId, videoUrl);

        return {
          id: assetId,
          type: 'video',
          mode: options.mode,
          url: videoUrl,
          prompt: options.prompt,
          aspectRatio,
          startFrameUrl: options.startFrameUrl,
          endFrameUrl: options.endFrameUrl,
          referenceImageUrls: options.referenceImageUrls,
          durationSeconds: options.durationSeconds || 8,
          alt: options.alt || options.prompt,
          createdAt: new Date().toISOString(),
        };
      } catch (e: any) {
        console.warn(`Attempt with video model ${modelName} failed:`, e);
        lastError = e;
      }
    }

    throw new Error(`影片生成失敗: ${lastError?.message || '您的 Gemini API 金鑰可能尚未開通 Veo 影片生成權限或超過配額。'}`);
  }
};
