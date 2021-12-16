import './sidebar.css';

export interface SidebarProps {
  currentPlaylist: any;
  playlistMap: Map<string, any>;
}

export function Sidebar({ currentPlaylist, playlistMap }: SidebarProps) {

  return (
    <div className="sidebar">
      {currentPlaylist && 
        <div className="sidebar-playlist-info">
          <img src={currentPlaylist.images[0].url} />
          <div className="sidebar-playlist-info-text">
            <h2>{currentPlaylist.name}</h2>
            <p>{`${currentPlaylist.tracks.items.length} tracks`}</p>
          </div>
        </div>
      }
    </div>
  );
}
