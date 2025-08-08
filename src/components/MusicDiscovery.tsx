import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SongCard } from "./SongCard";
import { Search, Music, Sparkles, Loader2, History, X, RefreshCw, Share2, Waves, Heart, Zap } from "lucide-react";
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

interface SearchHistory {
  url: string;
  title: string;
  artist: string;
  timestamp: number;
}

export const MusicDiscovery = () => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();

  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('songLensHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    }
  }, []);

  // Save search history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('songLensHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  const isValidYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[a-zA-Z0-9_-]+/;
    return youtubeRegex.test(url);
  };

  const addToHistory = (url: string, title: string, artist: string) => {
    const newHistory = [
      { url, title, artist, timestamp: Date.now() },
      ...searchHistory.filter(item => item.url !== url)
    ].slice(0, 10); // Keep only last 10 searches
    setSearchHistory(newHistory);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    toast({
      title: "History Cleared",
      description: "Search history has been cleared.",
    });
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
      addToHistory(youtubeUrl, currentSong.title, currentSong.artist);

      // Get similar tracks from Last.fm
      const similarTracks = await getSimilarTracks(
        currentSong.title,
        currentSong.artist
      );

      // Convert similar tracks to our Song format and search for YouTube URLs
      const recommendations: Song[] = await Promise.all(
        similarTracks.slice(0, 8).map(async (track) => {
          const youtubeUrl = await searchYouTubeForTrack(track.name, track.artist.name);
          const { getBestCoverArt, getSpotifySearchUrl } = await import('@/lib/api');
          
          // Get the best cover art with multiple fallbacks
          const coverArt = await getBestCoverArt(track, track.name, track.artist.name);
          
          return {
            title: track.name,
            artist: track.artist.name,
            coverArt: coverArt,
            youtubeUrl: youtubeUrl || undefined,
            spotifyUrl: getSpotifySearchUrl(track.name, track.artist.name),
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

  const handleHistoryItemClick = (historyItem: SearchHistory) => {
    setYoutubeUrl(historyItem.url);
    setShowHistory(false);
  };

  const handleClearCurrent = () => {
    setCurrentSong(null);
    setRecommendations([]);
    setYoutubeUrl("");
  };

  const handleShareResults = () => {
    if (!currentSong) return;
    
    const shareText = `🎵 I discovered "${currentSong.title}" by ${currentSong.artist} and found ${recommendations.length} similar songs! Check it out on Song Lens!`;
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: 'Song Lens Discovery',
        text: shareText,
        url: shareUrl,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`).then(() => {
        toast({
          title: "📋 Shared!",
          description: "Results copied to clipboard",
        });
      });
    }
  };

  // Calculate overall mood of recommendations
  const getOverallMood = () => {
    if (recommendations.length === 0) return null;
    
    const avgValence = recommendations.reduce((sum, song) => {
      return sum + (song.audioFeatures?.valence || 0.5);
    }, 0) / recommendations.length;
    
    const avgEnergy = recommendations.reduce((sum, song) => {
      return sum + (song.audioFeatures?.energy || 0.5);
    }, 0) / recommendations.length;
    
    if (avgValence > 0.7 && avgEnergy > 0.7) return { emoji: '🎉', text: 'High Energy & Happy', color: 'text-yellow-400' };
    if (avgValence > 0.7) return { emoji: '😊', text: 'Happy & Upbeat', color: 'text-green-400' };
    if (avgEnergy > 0.7) return { emoji: '⚡', text: 'High Energy', color: 'text-orange-400' };
    if (avgValence < 0.3) return { emoji: '😌', text: 'Chill & Relaxed', color: 'text-blue-400' };
    if (avgEnergy < 0.3) return { emoji: '🌙', text: 'Calm & Peaceful', color: 'text-purple-400' };
    return { emoji: '🎵', text: 'Balanced Mix', color: 'text-primary' };
  };

  const overallMood = getOverallMood();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-music rounded-full opacity-20 blur-3xl float-animation"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-music rounded-full opacity-20 blur-3xl float-animation" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-music rounded-full opacity-10 blur-3xl float-animation" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Floating Badge */}
            <div className="inline-flex items-center gap-2 glass-card px-6 py-3 rounded-full mb-8 hover-lift">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-primary font-medium">Powered by AI Music Analysis</span>
            </div>
            
            {/* Main Title */}
            <h1 className="text-6xl md:text-7xl font-bold mb-8 gradient-text leading-tight">
              Discover Your Next
              <br />
              <span className="text-foreground">Favorite Song</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Paste any YouTube song URL and discover similar tracks using Last.fm's music database 
              and YouTube's vast library of music videos.
            </p>

            {/* Enhanced URL Input */}
            <Card className="max-w-3xl mx-auto glass-card hover-lift">
              <CardContent className="p-8">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="https://youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="text-lg h-14 pr-12 bg-background/50 border-border/50 focus:border-primary transition-colors"
                      disabled={isLoading}
                    />
                    {youtubeUrl && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setYoutubeUrl("")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="h-14 px-8 bg-gradient-music hover:opacity-90 transition-all duration-300 hover:scale-105"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        Find Similar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    className="h-14 px-4 border-border/50 hover:bg-accent/50"
                    title="Search History"
                  >
                    <History className="w-5 h-5" />
                  </Button>
                </div>
                
                {/* Enhanced Search History Dropdown */}
                {showHistory && searchHistory.length > 0 && (
                  <div className="mt-6 p-6 glass-card rounded-xl border border-glass-border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" />
                        Recent Searches
                      </h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearHistory}
                        className="h-8 px-3 text-xs hover:text-destructive"
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {searchHistory.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 hover:bg-accent/30 rounded-lg cursor-pointer transition-colors"
                          onClick={() => handleHistoryItemClick(item)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.artist}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {(currentSong || recommendations.length > 0) && (
        <div className="container mx-auto px-4 py-16 relative z-10">
          {/* Current Song */}
          {currentSong && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-music rounded-xl flex items-center justify-center">
                    <Music className="w-6 h-6 text-white" />
                  </div>
                  Analyzed Song
                </h2>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareResults}
                    className="border-border/50 hover:bg-accent/50"
                    title="Share Results"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearCurrent}
                    className="border-border/50 hover:bg-accent/50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    New Search
                  </Button>
                </div>
              </div>
              <SongCard {...currentSong} />
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-music rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  Similar Songs You Might Like
                </h2>
                {overallMood && (
                  <div className="flex items-center gap-3 px-4 py-2 glass-card rounded-full">
                    <span className="text-2xl">{overallMood.emoji}</span>
                    <span className={`text-sm font-medium ${overallMood.color}`}>{overallMood.text}</span>
                  </div>
                )}
              </div>
              <div className="grid gap-6">
                {recommendations.map((song, index) => (
                  <SongCard 
                    key={index} 
                    {...song}
                    onSelect={() => setCurrentSong(song)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Features Section */}
      {!currentSong && (
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 gradient-text">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our AI analyzes musical features to find your perfect matches
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="glass-card hover-lift group">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-music rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Extract & Analyze</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground leading-relaxed">
                  We extract the song information from YouTube and cross-reference with Last.fm's music database.
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-card hover-lift group">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-music rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">AI Matching</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground leading-relaxed">
                  Last.fm's similarity algorithms find tracks with similar musical characteristics and listener patterns.
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-card hover-lift group">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-music rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                  <Music className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Discover & Listen</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground leading-relaxed">
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

export default MusicDiscovery;