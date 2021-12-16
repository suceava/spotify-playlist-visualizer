import { API } from 'aws-amplify';
import { useCallback, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary'
import SpotifyWebApi from 'spotify-web-api-node';

import { Header } from './header/Header';
import { useStickyState } from './stickyState';
import WebPlayback from './WebPlayback'
import { PlayerControl } from './player/PlayerControl';
import { Analyzer } from './analyzer/Analyzer';
import { Sidebar } from './sidebar/Sidebar';
import { getCurrentPlaybackState, getPlaylist, getPlaylistTracks } from './spotify/spotifyApi';

import './App.css';

function App() {
  const search = window.localStorage.getItem('callback');

  const [token, setToken] = useStickyState<string | null>(null, 'token');
  const [spotifyApi, setSpotifyApi] = useState<SpotifyWebApi | null>(null);
  const [playbackState, setPlaybackState ] = useState<any>(null);
  const [playlistMap, setPlaylistMap] = useState<Map<string, any>>(new Map());
  const [currentPlaylist, setCurrentPlaylist] = useState<any>(null);
  const [fetchTimer, setFetchTimer] = useState<NodeJS.Timeout | null>(null);

  const setSpotifyApiToken = useCallback(
    (token: string | null) => {
      const api = spotifyApi ? spotifyApi : (token ? new SpotifyWebApi() : null);
      if (api) {
        if (token) {
          api.setAccessToken(token);
        } else {
          api.resetAccessToken();
        }
      }
      setSpotifyApi(api);
    },
    [ setSpotifyApi]
  );

  const setAuthToken = useCallback(
    (token: string | null) => {
      setSpotifyApiToken(token);
      setToken(token);
    },
    [setToken, setSpotifyApiToken]
  );

  const logOut = useCallback(
    () => {
      if (fetchTimer) {
        clearInterval(fetchTimer);
      }
      setAuthToken(null);
      setPlaybackState(null);
      setCurrentPlaylist(null);
    }, [fetchTimer]
  );

  useEffect(() => {
    async function fetchToken() {
      if (search) {
        // clear out the callback query string
        window.localStorage.removeItem('callback');

        try {
          const response = await API.get('spotifyapp', `/auth/callback${search}`, null);
          if (response && response.access_token) {
            setAuthToken(response.access_token);
          }
        } catch (e) {
          // error getting token => clear out token from state
          console.error('error', e);
          setAuthToken(null);
        }
      } else {
        setSpotifyApiToken(token);
      }
    }
    fetchToken();
  }, [search, token, setAuthToken, setSpotifyApiToken]);

  async function fetchCurrentPlaybackState(state: any) {
    let progressMs = 0, durationMs = 0;
    let currentState: any = null;
    let timeoutInterval = 10000;

    if (!spotifyApi) {
      return;
    }

    if (state) {
      progressMs = state.progress_ms;
      durationMs = state.item?.duration_ms || 0;
    }

    if (durationMs > 0 && (durationMs - progressMs) < timeoutInterval) {
      // less than 10 seconds left => set timeout to remaining time
      timeoutInterval = durationMs - progressMs + 10;
    }

    try {
      currentState = await getCurrentPlaybackState(spotifyApi);
    } catch (error: any) {
      if (error.message.includes("The access token expired.")) {
        setAuthToken(null);
      }
      currentState = null;
      timeoutInterval = 30000;
    }
    setPlaybackState(currentState);

    if (currentState?.context?.type === "playlist") {
      const playlistId = currentState.context.uri.split(":")[2];
      fetchPlaylist(playlistId);
    }

    const timer = setTimeout(() => fetchCurrentPlaybackState(currentState), timeoutInterval);
    setFetchTimer(timer);
  }
  async function fetchPlaylist(playlistId: string) {
    if (!spotifyApi || !playlistId || playlistMap.has(playlistId)) {
      return;
    }

    // fetch playlist
    let playlist = await getPlaylist(spotifyApi, playlistId, false);
    if (playlist) {
      // update state with playlist before fetching tracks
      setPlaylistMap(playlistMap.set(playlistId, playlist));
      setCurrentPlaylist(playlist);
      // fetch tracks
      playlist = await getPlaylistTracks(spotifyApi, playlist);
      setPlaylistMap(playlistMap.set(playlistId, playlist));
      setCurrentPlaylist(playlist);
    }
  }

  useEffect(() => {
    if (spotifyApi && token && !fetchTimer) {
      fetchCurrentPlaybackState(playbackState);
    }
    return () => {
      if (fetchTimer) {
        clearTimeout(fetchTimer);
      }
    };
  }, [spotifyApi]);

  return (
    <div className="App">
      <div className="app-grid">
        <div className="app-header">
          <Header token={token} logOut={logOut} />
        </div>
        <div className="app-sidebar">
          <Sidebar currentPlaylist={currentPlaylist} playlistMap={playlistMap} />
        </div>
        <div className="app-content">
          { playbackState && currentPlaylist &&
            <Analyzer playbackState={playbackState} playlist={currentPlaylist} />
          }
          { token && <WebPlayback token={token} setToken={setAuthToken} />}
        </div>
        <div className="app-footer">
          { playbackState && 
            <ErrorBoundary FallbackComponent={() => (<div>Error</div>)}>
              <PlayerControl playbackState={playbackState} />
            </ErrorBoundary>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
