import { z } from "zod";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

// Allowed video hosting domains
const ALLOWED_DOMAINS = [
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "tiktok.com",
  "www.tiktok.com",
  "vm.tiktok.com",
];

/**
 * Zod schema for validating video URLs from allowed platforms
 */
export const videoUrlSchema = z
  .string()
  .url("URL inválida")
  .refine(
    (url) => {
      try {
        const urlObj = new URL(url);
        return ALLOWED_DOMAINS.some(
          (d) => urlObj.hostname === d || urlObj.hostname.endsWith(`.${d}`)
        );
      } catch {
        return false;
      }
    },
    { message: "URL deve ser do YouTube ou TikTok" }
  );

interface VideoStatistics {
  viewCount: string;
  likeCount?: string;
  commentCount?: string;
}

interface VideoSnippet {
  title: string;
  description: string;
  channelTitle: string;
  thumbnails: {
    default?: { url: string };
    medium?: { url: string };
    high?: { url: string };
  };
}

interface YouTubeVideoResponse {
  items: Array<{
    id: string;
    snippet: VideoSnippet;
    statistics: VideoStatistics;
  }>;
}

export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function extractTikTokVideoId(url: string): string | null {
  const patterns = [
    /tiktok\.com\/@[^/]+\/video\/(\d+)/,
    /tiktok\.com\/t\/([a-zA-Z0-9]+)/,
    /vm\.tiktok\.com\/([a-zA-Z0-9]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function detectPlatform(
  url: string
): "YOUTUBE" | "TIKTOK" | "INSTAGRAM" | "TWITTER" | null {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return "YOUTUBE";
  }
  if (url.includes("tiktok.com")) {
    return "TIKTOK";
  }
  if (url.includes("instagram.com")) {
    return "INSTAGRAM";
  }
  if (url.includes("twitter.com") || url.includes("x.com")) {
    return "TWITTER";
  }
  return null;
}

export interface VideoStats {
  views: number;
  title: string;
  description: string;
}

export async function getYouTubeVideoStats(
  videoId: string
): Promise<VideoStats | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error("YouTube API key not configured");
    return null;
  }

  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/videos?part=statistics,snippet&id=${videoId}&key=${apiKey}`
    );

    if (!response.ok) {
      console.error("YouTube API error:", response.statusText);
      return null;
    }

    const data: YouTubeVideoResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const video = data.items[0];
    return {
      views: parseInt(video.statistics.viewCount, 10),
      title: video.snippet.title,
      description: video.snippet.description,
    };
  } catch (error) {
    console.error("Error fetching YouTube video stats:", error);
    return null;
  }
}

/**
 * Batch fetch YouTube video statistics for multiple videos
 * YouTube API accepts up to 50 IDs per request
 */
export async function getYouTubeVideosStatsBatch(
  videoIds: string[]
): Promise<Map<string, VideoStats>> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const results = new Map<string, VideoStats>();

  if (!apiKey) {
    console.error("YouTube API key not configured");
    return results;
  }

  if (videoIds.length === 0) {
    return results;
  }

  // YouTube API accepts up to 50 IDs per request
  const BATCH_SIZE = 50;

  try {
    for (let i = 0; i < videoIds.length; i += BATCH_SIZE) {
      const batch = videoIds.slice(i, i + BATCH_SIZE);
      const ids = batch.join(",");

      const response = await fetch(
        `${YOUTUBE_API_BASE}/videos?part=statistics,snippet&id=${ids}&key=${apiKey}`
      );

      if (!response.ok) {
        console.error("YouTube API error:", response.statusText);
        continue;
      }

      const data: YouTubeVideoResponse = await response.json();

      if (data.items) {
        for (const video of data.items) {
          results.set(video.id, {
            views: parseInt(video.statistics.viewCount, 10),
            title: video.snippet.title,
            description: video.snippet.description,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error fetching YouTube videos stats batch:", error);
  }

  return results;
}

export function generateVerificationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "KLIPEI-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function verifyOwnershipCode(
  videoId: string,
  code: string
): Promise<boolean> {
  const stats = await getYouTubeVideoStats(videoId);

  if (!stats) {
    return false;
  }

  // Check if the verification code is in the video description
  return stats.description.includes(code);
}
