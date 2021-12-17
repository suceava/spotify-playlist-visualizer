import { useEffect, useState } from 'react';

import { updateScatterData } from '../data/scatterData';
import { ShuffleAnalyzer } from './ShuffleAnalyzer';
import { ShuffleVisualizer } from './ShuffleVisualizer';
import { PlaybackState } from '../data/playbackState';
import { PlaylistData } from '../data/playlistData';

import './analyzer.css';

interface AnalyzerProps {
  currentData: PlaylistData;
  setPlaylistData: React.Dispatch<React.SetStateAction<PlaylistData[]>>;
  playlistData: PlaylistData[];
  playbackState: PlaybackState;
  playlist: any;
}

export function Analyzer({
  playbackState,
  playlist,
  currentData,
  setPlaylistData,
  playlistData
}: AnalyzerProps) {
  const playlistTrackCount = playlist?.tracks?.items?.length || 0;
  const { scatterData } = currentData;

  useEffect(() => {
    const track = playbackState.playback.item;
    if (track && playlist) {
      const trackIndex = playlist.tracks.items.findIndex((t: any) => t.track.id === track.id) + 1;
      if (playbackState.hasTrackChanged) {
        updateScatterData(scatterData, trackIndex, track);
        currentData.scatterData = scatterData;
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
