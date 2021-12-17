import { useEffect, useState } from "react";

import { PlaybackState } from "../data/playbackState";

import './player.css';

interface PlayerControlProps {
  playbackState: PlaybackState;
}

function formatTime(ms: number) {
  const time = ms / 1000;
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
}

function renderPlay() {
  return (
    <svg role="img" height="16" width="16" viewBox="0 0 16 16">
      <path d="M4.018 14L14.41 8 4.018 2z"></path>
    </svg>
  );
}
function renderPause() {
  return (
    <svg role="img" height="16" width="16" viewBox="0 0 16 16">
      <path fill="none" d="M0 0h16v16H0z"></path>
      <path d="M3 2h3v12H3zm7 0h3v12h-3z"></path>
    </svg>
  );
}

export function PlayerControl({ playbackState }: PlayerControlProps) {
  const { playback } = playbackState;
  const progress_ms = playback.progress_ms || 0;
  const [progressMs, setProgressMs] = useState<number>(progress_ms);
  
  function onProgress(progressMs: number, timestamp: number) {
    let newProgressMs = progressMs + (new Date().getTime() - timestamp);
    const durationMs = playback.item?.duration_ms || 0;
    if (newProgressMs > durationMs) {
      newProgressMs = durationMs;
    }
    setProgressMs(newProgressMs);
  }

  useEffect(() => {
    let interval: any;
    if (playback) {
      const progressMs = playback.progress_ms || 0;
      if (playback.is_playing) {
        // device playing => start interval
        const timestamp = new Date().getTime();
        interval = setInterval(() => onProgress(progressMs, timestamp), 1000);
      } else {
        // device not playing => keep given progress
        setProgressMs(progressMs);
      }
    }
    return () => {
      clearInterval(interval);
    }
  }, [playback]);

  if (!playback) {
    return <div>Loading...</div>;
  }

  const {
    item
  } = playback || {};

  return (
    <div className="player">
      { playback && item && 
        <>
          <div className="player-info">
            <div className="player-info-cover">
              { "album" in item && 
                <img src={item.album.images[0].url} alt="" />
              }
            </div>
            <div className="player-info-details">
              <div className="player-info-details-title">
                {item.name}
              </div>
              <div className="player-info-details-artist">
                { "artists" in item && item.artists.map((a: any) => a.name).join(', ') }
              </div>
            </div>
          </div>
          <div className="player-controls">
            <div className="player-controls-buttons">
              <button onClick={() => console.log('toggle')}>
                { playback.is_playing ? renderPause() : renderPlay() }
              </button>
            </div>
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
