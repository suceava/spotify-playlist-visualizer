import { useEffect } from 'react';

import { updateScatterData } from '../data/scatterData';
import { ShuffleAnalyzer } from './ShuffleAnalyzer';
import { ShuffleVisualizer } from './ShuffleVisualizer';
import { PlaybackState } from '../data/playbackState';
import { PlaylistData } from '../data/playlistData';

import './analyzer.css';

interface AnalyzerProps {
  isAnalyzing: boolean;
  currentData: PlaylistData;
  setPlaylistData: React.Dispatch<React.SetStateAction<PlaylistData[]>>;
  playlistData: PlaylistData[];
  playbackState?: PlaybackState;
  playlist: SpotifyApi.SinglePlaylistResponse | null;
}

export function Analyzer({
  isAnalyzing,
  playbackState,
  playlist,
  currentData,
  setPlaylistData,
  playlistData
}: AnalyzerProps) {
  const { scatterData } = currentData;
  const playlistTrackCount = currentData.playlist.tracks.total;

  useEffect(() => {
    console.log('Analyzer useEffect', playbackState, new Date());
    if (playbackState) {
      const track = playbackState.playback.item;
      if (isAnalyzing && track && playlist && playlist.uri === playbackState.playback.context?.uri) {
        const trackIndex = playlist.tracks.items.findIndex((t: any) => t.track.id === track.id) + 1; // +1 because spotify starts at 0
        if (trackIndex >= 1 && (playbackState.hasTrackChanged || !scatterData[trackIndex])) {
          console.log(`Updating scatter data for track ${trackIndex} of ${playlistTrackCount}`);
          updateScatterData(scatterData, trackIndex, track);
          currentData.scatterData = scatterData;
          // update track total just in case it has changed
          currentData.playlist.tracks.total = playlist.tracks.total;
          setPlaylistData(Array.from(playlistData));
        }
      }
    }
  }, [isAnalyzing, playbackState, playlist]);

  return (
    <div className="analyzer">
      <ShuffleAnalyzer playlistTrackCount={playlistTrackCount} scatterData={scatterData} />
      <ShuffleVisualizer playlistTrackCount={playlistTrackCount} scatterData={scatterData} />
    </div>
  );
}
