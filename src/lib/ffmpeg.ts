// lib/ffmpeg.ts
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export class FFmpegService {
  private ffmpeg: FFmpeg | null = null;
  private loaded = false;

  async load(onProgress?: (message: string) => void) {
    if (this.loaded) return;

    this.ffmpeg = new FFmpeg();

    if (onProgress) {
      this.ffmpeg.on("log", ({ message }) => {
        onProgress(message);
      });
    }

    // Use ESM for Vite/Next.js
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
      workerURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.worker.js`,
        "text/javascript"
      ),
    });

    this.loaded = true;
  }

  async createVideo(
    images: { primary: string; secondary: string }[],
    audioFile: File | null,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    if (!this.ffmpeg) throw new Error("FFmpeg not loaded");

    // Track progress
    if (onProgress) {
      this.ffmpeg.on("progress", ({ progress, time }) => {
        onProgress(Math.round(progress * 100));
      });
    }

    // Write images to virtual filesystem
    const imageFiles: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const { primary, secondary } = images[i];

      // Download and process primary image
      const primaryData = await fetchFile(primary);
      const primaryName = `primary_${i}.jpg`;
      await this.ffmpeg.writeFile(primaryName, primaryData);
      imageFiles.push(primaryName);

      // Download and process secondary image
      const secondaryData = await fetchFile(secondary);
      const secondaryName = `secondary_${i}.jpg`;
      await this.ffmpeg.writeFile(secondaryName, secondaryData);

      if (onProgress) {
        onProgress((i / images.length) * 50);
      }
    }

    // Create concat file for images
    const concatContent = imageFiles.map((file) => `file ${file}`).join("\n");
    await this.ffmpeg.writeFile("concat.txt", concatContent);

    // Handle audio if provided
    if (audioFile) {
      const audioData = await fetchFile(audioFile);
      await this.ffmpeg.writeFile("audio.wav", audioData);
    }

    // Build FFmpeg command
    const command = [
      // Input images
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      "concat.txt",
      // Optional audio input
      ...(audioFile ? ["-i", "audio.wav"] : []),
      // Video settings
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "23",
      // Frame rate
      "-r",
      "30",
      // Audio settings (if provided)
      ...(audioFile ? ["-c:a", "aac", "-b:a", "128k", "-shortest"] : []),
      // Output
      "output.mp4",
    ];

    // Execute FFmpeg command
    await this.ffmpeg.exec(command);

    // Read output file
    const data = await this.ffmpeg.readFile("output.mp4");
    return new Blob([data], { type: "video/mp4" });
  }

  async cleanup() {
    if (!this.ffmpeg) return;
    // Clean up any remaining files
    try {
      const files = await this.ffmpeg.listDir("/");
      for (const file of files) {
        await this.ffmpeg.deleteFile(file.name);
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  }
}

export const ffmpegService = new FFmpegService();
