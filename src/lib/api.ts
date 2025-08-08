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

// Array of beautiful music-themed fallback images
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&sat=-50',
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop&sat=-50',
  'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop&sat=-50'
];

// Function to get a random fallback image
const getRandomFallbackImage = (): string => {
  return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
};

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

// Helper function to get artist's top tracks
export const getArtistTopTracks = async (artist: string): Promise<LastFmTrack[]> => {
  try {
    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks` +
      `&artist=${encodeURIComponent(artist)}` +
      `&api_key=${LASTFM_API_KEY}` +
      `&format=json` +
      `&limit=5`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.toptracks?.track || [];
  } catch (error) {
    console.error('Error getting artist top tracks:', error);
    return [];
  }
};

export const getSimilarTracks = async (title: string, artist: string): Promise<LastFmTrack[]> => {
  try {
    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=track.getSimilar` +
      `&artist=${encodeURIComponent(artist)}` +
      `&track=${encodeURIComponent(title)}` +
      `&api_key=${LASTFM_API_KEY}` +
      `&format=json` +
      `&limit=12` +  // Increased from 10 to 12
      `&autocorrect=1`  // Enable autocorrection of misspelled artist/track names
    );
    
    if (!response.ok) throw new Error('Failed to fetch similar tracks');
    
    let data = await response.json();
    let similarTracks = data.similartracks?.track || [];
    
    // If we don't have enough similar tracks, try getting artist's top tracks
    if (similarTracks.length < 5) {
      console.log('Not enough similar tracks, trying artist top tracks...');
      const artistTracks = await getArtistTopTracks(artist);
      similarTracks = [...new Set([...similarTracks, ...artistTracks])]; // Remove duplicates
    }
    
    // If still not enough results, try a more general search
    if (similarTracks.length < 5) {
      console.log('Still not enough tracks, trying general search...');
      const searchResults = await searchLastFmByTitle(title);
      similarTracks = [...new Set([...similarTracks, ...searchResults])];
    }
    
    return similarTracks.slice(0, 10); // Return max 10 tracks
  } catch (error) {
    console.error('Error in getSimilarTracks:', error);
    return [];
  }
};

// Helper function to search tracks by title
const searchLastFmByTitle = async (title: string): Promise<LastFmTrack[]> => {
  try {
    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=track.search` +
      `&track=${encodeURIComponent(title)}` +
      `&api_key=${LASTFM_API_KEY}` +
      `&format=json` +
      `&limit=5`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.results?.trackmatches?.track || [];
  } catch (error) {
    console.error('Error searching Last.fm by title:', error);
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

// New function to search for better thumbnails using YouTube
export const searchYouTubeThumbnail = async (title: string, artist: string): Promise<string | null> => {
  try {
    const query = `${artist} ${title}`;
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=1&key=${YOUTUBE_API_KEY}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const thumbnail = data.items[0].snippet.thumbnails.high?.url || 
                       data.items[0].snippet.thumbnails.medium?.url || 
                       data.items[0].snippet.thumbnails.default?.url;
      return thumbnail || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error searching YouTube thumbnail:', error);
    return null;
  }
};

// New function to generate Spotify search URL
export const getSpotifySearchUrl = (title: string, artist: string): string => {
  const query = encodeURIComponent(`${title} ${artist}`);
  return `https://open.spotify.com/search/${query}`;
};

// Enhanced function to get better cover art with multiple fallbacks
export const getBestCoverArt = async (track: LastFmTrack, title?: string, artist?: string): Promise<string> => {
  // First, try to get cover art from Last.fm
  if (track.image && track.image.length > 0) {
    // Prefer large images, fallback to medium, then small
    const largeImage = track.image.find(img => img.size === 'large' || img.size === 'extralarge');
    if (largeImage && largeImage['#text'] && largeImage['#text'].length > 0) {
      return largeImage['#text'];
    }
    
    const mediumImage = track.image.find(img => img.size === 'medium');
    if (mediumImage && mediumImage['#text'] && mediumImage['#text'].length > 0) {
      return mediumImage['#text'];
    }
    
    const smallImage = track.image.find(img => img.size === 'small');
    if (smallImage && smallImage['#text'] && smallImage['#text'].length > 0) {
      return smallImage['#text'];
    }
  }
  
  // If Last.fm doesn't have good cover art, try YouTube
  if (title && artist) {
    try {
      const youtubeThumbnail = await searchYouTubeThumbnail(title, artist);
      if (youtubeThumbnail) {
        return youtubeThumbnail;
      }
    } catch (error) {
      console.error('Error getting YouTube thumbnail:', error);
    }
  }
  
  // Final fallback: random beautiful music image
  return getRandomFallbackImage();
};