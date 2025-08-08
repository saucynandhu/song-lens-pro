import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Play, Music } from "lucide-react";

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
}

export const SongCard = ({ 
  title, 
  artist, 
  coverArt, 
  spotifyUrl, 
  youtubeUrl,
  audioFeatures 
}: SongCardProps) => {
  return (
    <Card className="group bg-gradient-card hover:bg-card-hover border-border/50 transition-all duration-300 hover:shadow-music-glow hover:scale-105">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
            {coverArt ? (
              <img 
                src={coverArt} 
                alt={`${title} cover`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-music flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Play className="w-6 h-6 text-white" fill="white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{title}</h3>
            <p className="text-muted-foreground text-sm truncate">{artist}</p>
            
            {audioFeatures && (
              <div className="flex gap-2 mt-2">
                {audioFeatures.danceability && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                    Dance: {Math.round(audioFeatures.danceability * 100)}%
                  </span>
                )}
                {audioFeatures.energy && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                    Energy: {Math.round(audioFeatures.energy * 100)}%
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            {youtubeUrl && (
              <Button 
                size="sm" 
                variant="outline" 
                className="border-primary/50 hover:bg-primary hover:text-primary-foreground"
                asChild
              >
                <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            )}
            {spotifyUrl && (
              <Button 
                size="sm"
                className="bg-gradient-music hover:opacity-90"
                asChild
              >
                <a href={spotifyUrl} target="_blank" rel="noopener noreferrer">
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