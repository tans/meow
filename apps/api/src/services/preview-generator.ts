/**
 * Preview Generator Service
 * 
 * Generates preview versions of uploaded files:
 * - Images: Resized to 480px width
 * - Videos: Transcoded to 30% of original bitrate
 */

import { execFile } from 'node:child_process';
import { mkdtemp, writeFile, readFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface PreviewGenerationResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  metadata?: {
    width?: number;
    height?: number;
    bitrate?: number;
    duration?: number;
  };
}

export class PreviewGenerator {
  /**
   * Generate image preview (480px width)
   */
  async generateImagePreview(
    sourceBuffer: Buffer,
    mimeType: string
  ): Promise<PreviewGenerationResult> {
    const tempDir = await mkdtemp(join(tmpdir(), 'preview-img-'));
    const inputPath = join(tempDir, 'input');
    const outputPath = join(tempDir, 'output.jpg');

    try {
      // Write input to temp file
      await writeFile(inputPath, sourceBuffer);

      // Use sharp if available, otherwise ImageMagick convert
      try {
        const { default: sharp } = await import('sharp');
        await sharp(inputPath)
          .resize(480, null, { withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(outputPath);
      } catch {
        // Fallback to ImageMagick
        await execFileAsync('convert', [
          inputPath,
          '-resize', '480x>',
          '-quality', '80',
          outputPath
        ]);
      }

      return {
        success: true,
        outputPath,
        metadata: { width: 480 }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate video preview (30% bitrate)
   */
  async generateVideoPreview(
    sourceBuffer: Buffer,
    mimeType: string
  ): Promise<PreviewGenerationResult> {
    const tempDir = await mkdtemp(join(tmpdir(), 'preview-vid-'));
    const inputPath = join(tempDir, 'input');
    const outputPath = join(tempDir, 'output.mp4');

    try {
      // Write input to temp file
      await writeFile(inputPath, sourceBuffer);

      // Get video metadata
      const { stdout: probeOutput } = await execFileAsync('ffprobe', [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height,bit_rate,duration',
        '-of', 'default=noprint_wrappers=1',
        inputPath
      ]);

      const metadata = this.parseVideoMetadata(probeOutput);
      const targetBitrate = Math.floor((metadata.bitrate || 1000000) * 0.3);
      const cappedBitrate = Math.min(targetBitrate, 2000000); // Cap at 2Mbps

      // Transcode with 2-minute timeout
      await execFileAsync('ffmpeg', [
        '-i', inputPath,
        '-c:v', 'libx264',
        '-b:v', `${cappedBitrate}`,
        '-maxrate', `${cappedBitrate * 1.5}`,
        '-bufsize', `${cappedBitrate * 2}`,
        '-vf', 'scale=min(720\,iw):-2', // Max 720p height
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-y',
        outputPath
      ], { timeout: 120000 });

      return {
        success: true,
        outputPath,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          bitrate: cappedBitrate,
          duration: metadata.duration
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanup(path: string): Promise<void> {
    try {
      await unlink(path);
      const dir = path.substring(0, path.lastIndexOf('/'));
      await rmdir(dir);
    } catch {
      // Ignore cleanup errors
    }
  }

  private parseVideoMetadata(probeOutput: string): {
    width?: number;
    height?: number;
    bitrate?: number;
    duration?: number;
  } {
    const result: { width?: number; height?: number; bitrate?: number; duration?: number } = {};
    
    for (const line of probeOutput.split('\n')) {
      const [key, value] = line.split('=');
      if (key === 'width') result.width = parseInt(value, 10);
      if (key === 'height') result.height = parseInt(value, 10);
      if (key === 'bit_rate') result.bitrate = parseInt(value, 10);
      if (key === 'duration') result.duration = parseFloat(value);
    }
    
    return result;
  }
}
