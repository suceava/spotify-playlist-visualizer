import './sidebar.css';

export interface SidebarProps {
  currentPlaylistId: string | null;
  playlistMap: Map<string, any>;
}

export function Sidebar({ currentPlaylistId, playlistMap }: SidebarProps) {
  const playlist = currentPlaylistId ? playlistMap.get(currentPlaylistId) : null;

  return (
    <div className="sidebar">
      {playlist && 
        <div className="sidebar-playlist-info">
          <img src={playlist.images[0].url} />
          <div className="sidebar-playlist-info-text">
            <h2>{playlist.name}</h2>
          </div>
        </div>
      }
    </div>
  );
}
