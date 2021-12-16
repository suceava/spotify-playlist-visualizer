import { useCallback, useEffect } from 'react';
import { ResponsiveContainer, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from 'recharts';

import { useStickyState } from '../stickyState';

import './analyzer.css';

export interface ShuffleAnalyzerProps {
  playbackState: any;
  playlist: any;
}

interface ScatterData {
  index: number;
  y: number;
  count: number;
  timestamp: Date;
}

export function ShuffleAnalyzer({ playbackState, playlist }: ShuffleAnalyzerProps) {
  const playlistTrackCount = playlist?.tracks?.items?.length || 0;

  const [scatterData, setScatterData] = useStickyState<ScatterData[]>([], 'scatterData');
  const [lastTrackIndex, setLastTrackIndex] = useStickyState<number>(-1, 'lastTrackIndex');

  let trackIndex = -1;
  useEffect(() => {
    const track = playbackState.item;
    if (track && playlist) {
      trackIndex = playlist.tracks.items.findIndex((t: any) => t.track.id === track.id) + 1;
      console.log(`trackIndex: ${trackIndex}  lastTrackIndex: ${lastTrackIndex}`);
      if (trackIndex !== lastTrackIndex) {
        const data = scatterData[trackIndex];
        if (data) {
          data.count += 1;
        } else {
          scatterData[trackIndex] = {
            index: trackIndex,
            y: 1,
            count: 1,
            timestamp: new Date()
          };
        }
        setLastTrackIndex(trackIndex);
        setScatterData(scatterData);
      }
    }
  }, [playbackState, playlist]);

  return (
    <div className="shuffle-analyzer">
      { playlistTrackCount > 0 && 
        <div className="shuffle-analyzer-shuffle-distribution">
          <ResponsiveContainer width="100%" height={100}>
            <ScatterChart width={50}>
              <XAxis
                type="number"
                dataKey="index"
                domain={[0, playlistTrackCount]}
                interval={0}
                tick={{ fontSize: 8 }}
                padding={{left: 20, right: 20}}
              />
              <YAxis type="number" dataKey="y" hide={true} domain={[1, 1]} />
              <ZAxis type="number" dataKey="count" range={[50,50]} />
              <Scatter data={scatterData} fill="#1cb954" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      }
      <div>
        {trackIndex}
      </div>
    </div>
  );
}
