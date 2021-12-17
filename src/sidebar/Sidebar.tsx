import List from "@mui/material/List";
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useCallback, useState } from "react";

import { PlaylistData } from '../data/playlistData';

import './sidebar.css';

export interface SidebarProps {
  currentPlaylist: SpotifyApi.SinglePlaylistResponse | null;
  playlistMap: Map<string, any>;
  playlistData: PlaylistData[];
}

export function Sidebar({ currentPlaylist, playlistMap, playlistData }: SidebarProps) {
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const onListItemClick = useCallback(
    (event, playlist, index) => {
      console.log(playlist, index);
      setSelectedPlaylist(playlist.name);
    },
    [playlistData],
  )
  return (
    <div className="sidebar">
      <div className="sidebar-playlist">
        { currentPlaylist && 
          <div className="sidebar-playlist-info">
            <img src={currentPlaylist.images[0].url} alt="" />
            <div className="sidebar-playlist-info-text">
              <h2>{currentPlaylist.name}</h2>
              <p>{`${currentPlaylist.tracks.items.length} tracks`}</p>
            </div>
          </div>
        }
      </div>
      <hr/>
      <div className="sidebar-playlist-data">
        <List dense={true}>
          {
            playlistData.map((playlist, i) => (
              <ListItemButton key={i} onClick={(e) => onListItemClick(e, playlist, i)} selected={selectedPlaylist === playlist.name}>
                <ListItemText>{playlist.name}</ListItemText>
              </ListItemButton>
            ))
          }
        </List>
      </div>
    </div>
  );
}
