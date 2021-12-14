import { useEffect, useState } from "react";

import './player.css';

function formatTime(ms: number) {
  const time = ms / 1000;
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
}

export function PlayerControl({ playbackState }: any) {
  const progress_ms = playbackState?.progress_ms || 0;
  const [progressMs, setProgressMs] = useState<number>(progress_ms);
  
  function onProgress(progressMs: number, timestamp: number) {
    let newProgressMs = progressMs + (new Date().getTime() - timestamp);
    const durationMs = playbackState?.item?.duration_ms || 0;
    if (newProgressMs > durationMs) {
      newProgressMs = durationMs;
    }
    setProgressMs(newProgressMs);
  }

  useEffect(() => {
    let interval: any;
    if (playbackState) {
      if (playbackState.is_playing) {
        // device playing => start interval
        const timestamp = new Date().getTime();
        interval = setInterval(() => onProgress(playbackState.progress_ms, timestamp), 1000);
      } else {
        // device not playing => keep given progress
        setProgressMs(playbackState.progress_ms);
      }
    }
    return () => {
      clearInterval(interval);
    }
  }, [playbackState]);

  if (!playbackState) {
    return <div>Loading...</div>;
  }

  const {
    item
  } = playbackState || {};

  return (
    <div className="player">
      { playbackState &&
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
                {item.artists.map((a: any) => a.name).join(', ')}
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
