import { ScatterData } from './scatterData';

export interface PlaylistInfo {
  description: string | null;
  id: string;
  href: string;
  name: string;
  public: boolean | null;
  tracks: {
    href: string;
    total: number;
  }
  type: string;
  uri: string;
}

export interface PlaylistData {
  name: string;
  playlist: PlaylistInfo;
  scatterData: ScatterData[];
  timestamp: number;
}

export function getPlaylistInfo(playlist: SpotifyApi.SinglePlaylistResponse): PlaylistInfo {
  return {
    description: playlist.description,
    id: playlist.id,
    href: playlist.external_urls.spotify,
    name: playlist.name,
    public: playlist.public,
    tracks: {
      href: playlist.tracks.href,
      total: playlist.tracks.total
    },
    type: playlist.type,
    uri: playlist.uri,
  };
}