const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const LASTFM_API_KEY = import.meta.env.VITE_LASTFM_API_KEY;

interface YouTubeVideoDetails {
  title: string;
  channelTitle: string;
  thumbnail: string;
  videoId: string;
}

interface LastFmTrack {
  name: string;
  artist: {
    name: string;
  };
  url: string;
  image?: Array<{ '#text': string; size: string }>;
}

export const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export const getYouTubeVideoDetails = async (videoId: string): Promise<YouTubeVideoDetails> => {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${YOUTUBE_API_KEY}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch YouTube video details');
  }
  
  const data = await response.json();
  
  if (!data.items || data.items.length === 0) {
    throw new Error('Video not found');
  }
  
  const video = data.items[0].snippet;
  
  return {
    title: video.title,
    channelTitle: video.channelTitle,
    thumbnail: video.thumbnails.high?.url || video.thumbnails.default?.url,
    videoId
  };
};

export const searchLastFmTrack = async (title: string, artist: string): Promise<LastFmTrack | null> => {
  try {
    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=track.search&track=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}&api_key=${LASTFM_API_KEY}&format=json&limit=1`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const tracks = data.results?.trackmatches?.track;
    
    if (tracks && tracks.length > 0) {
      return Array.isArray(tracks) ? tracks[0] : tracks;
    }
    
    return null;
  } catch (error) {
    console.error('Error searching Last.fm:', error);
    return null;
  }
};

export const getSimilarTracks = async (title: string, artist: string): Promise<LastFmTrack[]> => {
  try {
    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=track.getSimilar&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(title)}&api_key=${LASTFM_API_KEY}&format=json&limit=10`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const similarTracks = data.similartracks?.track;
    
    if (similarTracks && Array.isArray(similarTracks)) {
      return similarTracks;
    }
    
    return [];
  } catch (error) {
    console.error('Error getting similar tracks:', error);
    return [];
  }
};

export const searchYouTubeForTrack = async (title: string, artist: string): Promise<string | null> => {
  try {
    const query = `${artist} ${title}`;
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=1&key=${YOUTUBE_API_KEY}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      return `https://youtube.com/watch?v=${data.items[0].id.videoId}`;
    }
    
    return null;
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return null;
  }
};