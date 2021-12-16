import { ScatterData } from './scatterData';

export interface PlaylistData {
  name: string;
  playlist: any;
  scatterData: ScatterData[];
  timestamp: Date;
}
