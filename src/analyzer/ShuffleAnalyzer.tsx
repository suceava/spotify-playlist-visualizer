import { ResponsiveContainer, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from 'recharts';

import { ScatterData } from '../data/scatterData';

import './analyzer.css';

interface ShuffleAnalyzerProps {
  playlistTrackCount: number;
  scatterData: ScatterData[];
}

export function ShuffleAnalyzer({ playlistTrackCount, scatterData }: ShuffleAnalyzerProps) {


  return (
    <div className="shuffle-analyzer">
      { playlistTrackCount > 0 && 
        <div className="shuffle-analyzer-shuffle-distribution">
          <ResponsiveContainer width="100%" height={100}>
            <ScatterChart margin={{right: 20}}>
              <XAxis
                type="number"
                dataKey="trackIndex"
                domain={[1, playlistTrackCount]}
                interval={0}
                tick={{ fontSize: 8 }}
                tickCount={playlistTrackCount}
                padding={{left: 20, right: 20}}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[1, 1]}
                axisLine={false}
                tickLine={false}
                tick={false}
              />
              <ZAxis type="number" dataKey="count" range={[50,50]} />
              <Scatter data={scatterData} fill="#1cb954" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      }
    </div>
  );
}
