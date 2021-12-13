import { useEffect, useState } from "react";

import './player.css';

export function PlayerControl({ spotifyApi }: any) {
  const [ state, setState ] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      const state = await spotifyApi.getMyCurrentPlaybackState();
      console.log("current playback", state);
      setState(state);
    }
    fetchData();
  }, [spotifyApi]);

  return (
    <div className="player">
      <div className="player-info">
        { state &&
          <img src={state.body.item.album.images[0].url} className="player-info-cover" alt="" />
        }
      </div>

    </div>
  );
}
