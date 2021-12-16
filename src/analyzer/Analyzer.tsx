import { useEffect, useState } from 'react';

import { ScatterData, updateScatterData } from '../data/scatterData';
import { ShuffleAnalyzer } from './ShuffleAnalyzer';
import { ShuffleVisualizer } from './ShuffleVisualizer';
import { useStickyState } from '../stickyState';
import { PlaylistData } from '../data/playlistData';

import './analyzer.css';

interface AnalyzerProps {
  currentData: PlaylistData;
  setPlaylistData: React.Dispatch<React.SetStateAction<PlaylistData[]>>;
  playlistData: PlaylistData[];
  playbackState: any;
  playlist: any;
}

export function Analyzer({ playbackState, playlist, currentData, setPlaylistData, playlistData }: AnalyzerProps) {
  const playlistTrackCount = playlist?.tracks?.items?.length || 0;
  const { scatterData } = currentData;

  const [lastTrackIndex, setLastTrackIndex] = useStickyState<number>(-1, 'lastTrackIndex');

  useEffect(() => {
    const track = playbackState.item;
    if (track && playlist) {
      const trackIndex = playlist.tracks.items.findIndex((t: any) => t.track.id === track.id) + 1;
      if (trackIndex !== lastTrackIndex) {
        updateScatterData(scatterData, trackIndex, track);
        currentData.scatterData = scatterData;
        setLastTrackIndex(trackIndex);
        setPlaylistData(Array.from(playlistData));
      }
    }
  }, [playbackState, playlist]);

  return (
    <div className="analyzer">
      <ShuffleAnalyzer playlistTrackCount={playlistTrackCount} scatterData={scatterData} />
      <ShuffleVisualizer playlistTrackCount={playlistTrackCount} scatterData={scatterData} />
    </div>
  );
}
