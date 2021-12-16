import { ResponsiveContainer, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from 'recharts';

import { ScatterData, getScatterDataCount } from '../data/scatterData';
import { ShuffleVisualizerShape } from './ShuffleVisualizerShape';

import './analyzer.css';

interface ShuffleVisualizerProps {
  playlistTrackCount: number;
  scatterData: ScatterData[];
}

export function ShuffleVisualizer({ playlistTrackCount, scatterData }: ShuffleVisualizerProps) {
  const scatterDataCount = getScatterDataCount(scatterData);

  return (
    <div className="shuffle-visualizer" style={{height: Math.min(1, scatterDataCount)*56}}>
      { playlistTrackCount > 0 && 
        <ResponsiveContainer width="100%">
          <ScatterChart margin={{top: 27, bottom: 27, right: 20}}>
            <XAxis
              type="number"
              dataKey="trackIndex"
              domain={[1, playlistTrackCount]}
              padding={{left: 20, right: 20}}
              hide={true}
            />
            <YAxis
              type="number"
              dataKey="playIndex"
              domain={['dataMin', 'dataMax']}
              interval={0}
              tickCount={scatterDataCount}
              axisLine={false}
              tickLine={false}
            />
            <Scatter data={scatterData} fill="#1cb954" shape={<ShuffleVisualizerShape/>} />
          </ScatterChart>
        </ResponsiveContainer>
      }
    </div>
  );
}
