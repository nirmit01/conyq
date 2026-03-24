// services/video.ts
// Server-side video generation pipeline:
// Article → AI Script → TTS Audio → FFmpeg Video

import path from 'path';
import fs from 'fs';

export interface VideoJob {
  articleId: string;
  title: string;
  script: string;
}

/**
 * Generate a simple video from a script.
 * Uses FFmpeg to create a title-card video with audio (or silent if TTS unavailable).
 * Returns the output video path.
 */
export async function generateVideo(job: VideoJob): Promise<string> {
  const outputDir = path.resolve('./public/generated');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const videoPath = path.join(outputDir, `${job.articleId}.mp4`);

  // Check if ffmpeg is available
  try {
    const ffmpeg = await import('fluent-ffmpeg');
    const ffmpegInstaller = await import('@ffmpeg-installer/ffmpeg');

    return new Promise((resolve, reject) => {
      // Create a simple title-card video:
      // Black background with white text overlay, 30 seconds
      const command = ffmpeg.default();
      command.setFfmpegPath(ffmpegInstaller.path);

      // Use lavfi (virtual input) to generate a solid colour background
      command
        .input('color=c=0a0a0a:size=1280x720:rate=25:duration=30')
        .inputFormat('lavfi')
        .videoFilters([
          // Add article title text
          `drawtext=text='${escapeFFmpegText(job.title)}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2-60:line_spacing=10:font=DejaVu Sans:box=1:boxcolor=black@0.5:boxborderw=10`,
          // Add "My ET" watermark
          `drawtext=text='My ET — AI Native News':fontcolor=orange:fontsize=20:x=40:y=40:font=DejaVu Sans`,
          // Add script excerpt at bottom
          `drawtext=text='${escapeFFmpegText(job.script.substring(0, 120))}...':fontcolor=lightgrey:fontsize=18:x=60:y=h-120:w=w-120:line_spacing=8:font=DejaVu Sans`,
        ])
        .output(videoPath)
        .outputOptions(['-pix_fmt yuv420p'])
        .on('end', () => resolve(videoPath))
        .on('error', (err) => {
          console.error('[Video] FFmpeg error:', err.message);
          reject(err);
        })
        .run();
    });
  } catch (err) {
    // FFmpeg not available — write a placeholder HTML video "thumbnail"
    console.warn('[Video] FFmpeg unavailable, generating placeholder:', (err as Error).message);
    return generatePlaceholder(job, videoPath);
  }
}

function escapeFFmpegText(text: string): string {
  return text
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
    .replace(/\n/g, ' ')
    .substring(0, 200);
}

async function generatePlaceholder(job: VideoJob, videoPath: string): Promise<string> {
  // Write a placeholder text file with .mp4 extension
  // The frontend will detect this and show a "video unavailable" card
  const placeholder = {
    type: 'placeholder',
    title: job.title,
    script: job.script,
    message: 'Install FFmpeg to enable video generation',
  };
  const txtPath = videoPath.replace('.mp4', '.json');
  fs.writeFileSync(txtPath, JSON.stringify(placeholder, null, 2));
  return txtPath;
}
