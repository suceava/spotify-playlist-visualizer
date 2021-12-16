import { useEffect, useState } from 'react';

import { ScatterData, updateScatterData } from './scatterData';
import { ShuffleAnalyzer } from './ShuffleAnalyzer';
import { ShuffleVisualizer } from './ShuffleVisualizer';
import { useStickyState } from '../stickyState';

import './analyzer.css';

interface AnalyzerProps {
  playbackState: any;
  playlist: any;
}

export function Analyzer({ playbackState, playlist }: AnalyzerProps) {
  const playlistTrackCount = playlist?.tracks?.items?.length || 0;

  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [lastTrackIndex, setLastTrackIndex] = useStickyState<number>(-1, 'lastTrackIndex');
  const [lastPlaylist, setLastPlaylist] = useState<any>(null);
  const [scatterData, setScatterData] = useStickyState<ScatterData[]>([], 'scatterData');

  useEffect(() => {
    const track = playbackState.item;
    if (track && playlist) {
      const trackIndex = playlist.tracks.items.findIndex((t: any) => t.track.id === track.id) + 1;
      setCurrentTrackIndex(trackIndex);

      if (trackIndex !== lastTrackIndex) {
        console.log('trackIndex:', trackIndex);
        updateScatterData(scatterData, trackIndex, track);
        setLastTrackIndex(trackIndex);
        setScatterData(Array.from(scatterData));
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
