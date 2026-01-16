const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

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

export async function getYouTubeVideoStats(
  videoId: string
): Promise<{ views: number; title: string; description: string } | null> {
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
