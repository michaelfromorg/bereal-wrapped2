// components/video-generator.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { berealClient } from "@/lib/bereal";
import { ffmpegService } from "@/lib/ffmpeg";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  year: z.enum(["2022", "2023"]),
  audio: z.instanceof(File).optional()
});

export function VideoGenerator() {
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      year: "2023"
    }
  });

  async function onSubmit(data: z.infer<typeof schema>) {
    try {
      setLoading(true);
      setProgress(0);

      // Load FFmpeg
      await ffmpegService.load((p) => setProgress(p * 0.1));
      setProgress(10);

      // Fetch memories
      const memories = await berealClient.getMemories();
      setProgress(20);

      // Filter memories by year
      const yearMemories = memories.filter(memory =>
        memory.memoryDay.startsWith(data.year)
      );

      // Prepare image pairs
      const imagePairs = yearMemories.map(memory => ({
        primary: memory.mainPostPrimaryMedia.url,
        secondary: memory.mainPostSecondaryMedia.url
      }));

      // Generate video
      const videoBlob = await ffmpegService.createVideo(
        imagePairs,
        data.audio || null,
        (p) => setProgress(20 + p * 0.8)
      );

      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      setProgress(100);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (videoUrl) {
    return (
      <div className="space-y-4 w-full max-w-lg">
        <video
          src={videoUrl}
          controls
          className="w-full rounded-lg shadow-lg"
        />
        <div className="flex gap-4">
          <Button
            onClick={() => window.open(videoUrl, '_blank')}
            className="flex-1"
          >
            Download Video
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setVideoUrl(null);
              setProgress(0);
            }}
            className="flex-1"
          >
            Create Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a year" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="audio"
            render={({ field: { value, onChange, ...field } }) => (
              <FormItem>
                <FormLabel>Background Music (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="audio/wav"
                    onChange={(e) => onChange(e.target.files?.[0])}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Upload a .wav file for background music
                </FormDescription>
              </FormItem>
            )}
          />

          {loading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">
                {progress < 10 && "Loading FFmpeg..."}
                {progress >= 10 && progress < 20 && "Fetching your BeReals..."}
                {progress >= 20 && progress < 100 && "Generating video..."}
                {progress === 100 && "Done!"}
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Processing..." : "Generate Video"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
