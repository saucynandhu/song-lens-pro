import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SongCard } from "./SongCard";
import { Search, Music, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Song {
  title: string;
  artist: string;
  coverArt?: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  audioFeatures?: {
    danceability?: number;
    energy?: number;
    valence?: number;
  };
}

export const MusicDiscovery = () => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const { toast } = useToast();

  const isValidYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[a-zA-Z0-9_-]+/;
    return youtubeRegex.test(url);
  };

  const handleAnalyze = async () => {
    if (!youtubeUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a YouTube URL",
        variant: "destructive"
      });
      return;
    }

    if (!isValidYouTubeUrl(youtubeUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { extractVideoId, getYouTubeVideoDetails, searchLastFmTrack, getSimilarTracks, searchYouTubeForTrack } = await import('@/lib/api');
      
      // Extract video ID from YouTube URL
      const videoId = extractVideoId(youtubeUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // Get YouTube video details
      const youtubeDetails = await getYouTubeVideoDetails(videoId);
      
      // Search for the track on Last.fm
      const lastFmTrack = await searchLastFmTrack(youtubeDetails.title, youtubeDetails.channelTitle);
      
      const currentSong: Song = {
        title: lastFmTrack?.name || youtubeDetails.title,
        artist: lastFmTrack?.artist?.name || youtubeDetails.channelTitle,
        coverArt: youtubeDetails.thumbnail,
        youtubeUrl: youtubeUrl,
      };

      setCurrentSong(currentSong);

      // Get similar tracks from Last.fm
      const similarTracks = await getSimilarTracks(
        currentSong.title,
        currentSong.artist
      );

      // Convert similar tracks to our Song format and search for YouTube URLs
      const recommendations: Song[] = await Promise.all(
        similarTracks.slice(0, 8).map(async (track) => {
          const youtubeUrl = await searchYouTubeForTrack(track.name, track.artist.name);
          const largeImage = track.image?.find(img => img.size === 'large' || img.size === 'extralarge');
          
          return {
            title: track.name,
            artist: track.artist.name,
            coverArt: largeImage?.['#text'] || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
            youtubeUrl: youtubeUrl || undefined,
          };
        })
      );

      setRecommendations(recommendations);
      
      toast({
        title: "Analysis Complete!",
        description: `Found ${recommendations.length} similar songs`,
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-music opacity-10" />
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              Powered by AI Music Analysis
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-music bg-clip-text text-transparent">
              Discover Your Next Favorite Song
            </h1>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Paste any YouTube song URL and discover similar tracks using Last.fm's music database 
              and YouTube's vast library of music videos.
            </p>

            {/* URL Input */}
            <Card className="max-w-2xl mx-auto bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="https://youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="text-lg h-12"
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="h-12 px-8 bg-gradient-music hover:opacity-90"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Find Similar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {(currentSong || recommendations.length > 0) && (
        <div className="container mx-auto px-4 py-16">
          {/* Current Song */}
          {currentSong && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Music className="w-6 h-6 text-primary" />
                Analyzed Song
              </h2>
              <SongCard {...currentSong} />
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Similar Songs You Might Like
              </h2>
              <div className="grid gap-4">
                {recommendations.map((song, index) => (
                  <SongCard key={index} {...song} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Features Section */}
      {!currentSong && (
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Our AI analyzes musical features to find your perfect matches</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-music rounded-lg flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Extract & Analyze</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We extract the song information from YouTube and cross-reference with Last.fm's music database.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-music rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <CardTitle>AI Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Last.fm's similarity algorithms find tracks with similar musical characteristics and listener patterns.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-music rounded-lg flex items-center justify-center mb-4">
                  <Music className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Discover & Listen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get personalized recommendations with direct links to YouTube for instant listening.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};