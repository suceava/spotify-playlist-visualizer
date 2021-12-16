import { ResponsiveContainer, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from 'recharts';

import { ScatterData, getScatterDataCount } from './scatterData';
import { ShuffleVisualizerShape } from './ShuffleVisualizerShape';

import './analyzer.css';

interface ShuffleVisualizerProps {
  playlistTrackCount: number;
  scatterData: ScatterData[];
}

export function ShuffleVisualizer({ playlistTrackCount, scatterData }: ShuffleVisualizerProps) {
  const scatterDataCount = getScatterDataCount(scatterData);

  return (
    <div className="shuffle-visualizer" style={{height: scatterDataCount*56}}>
      { playlistTrackCount > 0 && 
        <ResponsiveContainer width="100%">
          <ScatterChart width={50} margin={{top: 27, bottom: 27, left: 10, right: 10}}>
            <XAxis
              type="number"
              dataKey="trackIndex"
              domain={[1, playlistTrackCount]}
              interval={0}
              tick={{ fontSize: 8 }}
              padding={{left: 20, right: 20}}
              hide={true}
            />
            <YAxis
              type="number"
              dataKey="playIndex"
              domain={['dataMin', 'dataMax']}
              reversed={true}
              hide={true}
            />
            <Scatter data={scatterData} fill="#1cb954" shape={<ShuffleVisualizerShape/>} />
          </ScatterChart>
        </ResponsiveContainer>
      }
    </div>
  );
}
