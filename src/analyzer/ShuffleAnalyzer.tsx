import './analyzer.css';

export interface ShuffleAnalyzerProps {
  playbackState: any;
  playlistMap: Map<string, any>;
}

export function ShuffleAnalyzer({ playbackState, playlistMap }: ShuffleAnalyzerProps) {
  const playlistId = playbackState.context.uri.split(":")[2];
  const playlist = playlistMap.get(playlistId);
  console.log('playlist', playlist);
  const track = playbackState.item;
  console.log('track', track);
  let trackIndex = -1;
  if (track && playlist) {
    trackIndex = playlist.tracks.items.findIndex((t: any) => t.track.id === track.id) + 1;
  }

  return (
    <div className="shuffle-analyzer">
      {trackIndex}
    </div>
  );
}
