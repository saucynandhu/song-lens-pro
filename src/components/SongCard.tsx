import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Play, Music, Youtube, Headphones, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface SongCardProps {
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
  onSelect?: () => void;
}

export const SongCard = ({ 
  title, 
  artist, 
  coverArt, 
  spotifyUrl, 
  youtubeUrl, 
  audioFeatures,
  onSelect 
}: SongCardProps) => {
  const { toast } = useToast();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  const handlePlayPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: "🎵 Music Preview",
      description: `Playing preview of "${title}" by ${artist}`,
    });
    // In a real app, you would integrate with a music API here
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect();
      toast({
        title: "🎯 Song Selected",
        description: `"${title}" is now your current song`,
      });
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <Card 
      className="group glass-card hover-lift cursor-pointer border border-glass-border"
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-6">
          {/* Enhanced Cover Art with Loading States */}
          <div className="relative w-20 h-20 bg-secondary rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
            {coverArt && !imageError ? (
              <>
                {imageLoading && (
                  <div className="absolute inset-0 bg-secondary flex items-center justify-center z-10">
                    <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                  </div>
                )}
                <img 
                  src={coverArt} 
                  alt={`${title} cover`}
                  className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${
                    imageLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  crossOrigin="anonymous"
                />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-music flex items-center justify-center">
                <Music className="w-8 h-8 text-white" />
              </div>
            )}
            <button 
              onClick={handlePlayPreview}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Play className="w-6 h-6 text-white" fill="white" />
              </div>
            </button>
          </div>
          
          {/* Song Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-foreground truncate mb-1">{title}</h3>
            <p className="text-muted-foreground text-sm truncate mb-3">{artist}</p>
            
            {/* Enhanced Audio Features */}
            {audioFeatures && (
              <div className="flex flex-wrap gap-2">
                {audioFeatures.danceability && (
                  <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-medium">
                    Dance: {Math.round(audioFeatures.danceability * 100)}%
                  </span>
                )}
                {audioFeatures.energy && (
                  <span className="text-xs bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full font-medium">
                    Energy: {Math.round(audioFeatures.energy * 100)}%
                  </span>
                )}
                {audioFeatures.valence && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-medium">
                    Mood: {audioFeatures.valence > 0.5 ? '😊' : '😌'}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {youtubeUrl && (
              <Button 
                size="sm" 
                variant="outline" 
                className="border-red-500/30 hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-105"
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" title="Watch on YouTube">
                  <Youtube className="w-4 h-4" />
                </a>
              </Button>
            )}
            {spotifyUrl && (
              <Button 
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white transition-all duration-300 hover:scale-105"
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <a href={spotifyUrl} target="_blank" rel="noopener noreferrer" title="Listen on Spotify">
                  <Headphones className="w-4 h-4" />
                </a>
              </Button>
            )}
            {!youtubeUrl && !spotifyUrl && (
              <Button 
                size="sm" 
                variant="outline" 
                className="border-primary/50 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105"
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist} ${title}`)}`} target="_blank" rel="noopener noreferrer" title="Search on YouTube">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SongCard;