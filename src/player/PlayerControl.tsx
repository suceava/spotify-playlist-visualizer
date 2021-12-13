import { useEffect, useState } from "react";

import './player.css';

function formatTime(ms: number) {
  const time = ms / 1000;
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
}

export function PlayerControl({ playbackState }: any) {
  const progress_ms = playbackState?.body?.progress_ms || 0;
  const [progressMs, setProgressMs] = useState<number>(progress_ms);
  
  function onProgress(progressMs: number, timestamp: number) {
    let newProgressMs = progressMs + (new Date().getTime() - timestamp);
    const durationMs = playbackState?.body?.item?.duration_ms || 0;
    if (newProgressMs > durationMs) {
      newProgressMs = durationMs;
    }
    setProgressMs(newProgressMs);
  }

  useEffect(() => {
    let interval: any;
    if (playbackState && playbackState.body) {
      if (playbackState.body.is_playing) {
        // device playing => start interval
        const timestamp = new Date().getTime();
        interval = setInterval(() => onProgress(playbackState.body.progress_ms, timestamp), 1000);
      } else {
        // device not playing => keep given progress
        setProgressMs(playbackState.body.progress_ms);
      }
    }
    return () => {
      clearInterval(interval);
    }
  }, [playbackState]);

  if (!playbackState || !playbackState.body) {
    return <div>Loading...</div>;
  }

  const {
    body: {
      item
    } = {} as any
  } = playbackState || {};

  return (
    <div className="player">
      { playbackState && playbackState.body &&
        <>
          <div className="player-info">
            <div className="player-info-cover">
              <img src={item.album.images[0].url} alt="" />
            </div>
            <div className="player-info-details">
              <div className="player-info-details-title">
                {item.name}
              </div>
              <div className="player-info-details-artist">
                {item.artists[0].name}
              </div>
            </div>
          </div>
          <div className="player-controls">
            <div className="player-controls-progress">
              <div className="player-controls-progress-elapsed">
                {formatTime(progressMs)}
              </div>
              <div className="player-controls-progress-bar">
                <div className="player-controls-progress-bar-total"></div>
                <div className="player-controls-progress-bar-elapsed" style={{ width: `${progressMs / item.duration_ms * 100}%` }} />
              </div>
              <div className="player-controls-progress-duration">
                {formatTime(item.duration_ms)}
              </div>
            </div>
          </div>
        </>
      }
    </div>
  );
}
