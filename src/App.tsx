import { API } from 'aws-amplify';
import { useCallback, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary'
import SpotifyWebApi from 'spotify-web-api-node';

import Login from './Login';
import { useStickyState } from './stickyState';
import WebPlayback from './WebPlayback'

import './App.css';
import { PlayerControl } from './player/PlayerControl';
import { ShuffleAnalyzer } from './analyzer/ShuffleAnalyzer';
import { Sidebar } from './sidebar/Sidebar';

function App() {
  const search = window.localStorage.getItem('callback');

  const [token, setToken] = useStickyState<string | null>(null, 'token');
  const [spotifyApi, setSpotifyApi] = useState<SpotifyWebApi | null>(null);
  const [playbackState, setPlaybackState ] = useState<any>(null);
  const [playlistMap, setPlaylistMap] = useState<Map<string, any>>(new Map());
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null);

  const setSpotifyApiToken = useCallback(
    (token: string | null) => {
      const api = token ? new SpotifyWebApi() : null;
      if (api) {
        api.setAccessToken(token || '');
      }
      setSpotifyApi(api);
    },
    [ setSpotifyApi]
  );

  const setAuthToken = useCallback(
    (token: string | null) => {
      setToken(token);
      setSpotifyApiToken(token);
    },
    [setToken, setSpotifyApiToken]
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

  let fetchTimer: any;
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
      const response = await spotifyApi.getMyCurrentPlaybackState();
      currentState = response.body;
      console.log("current playback", currentState);
    } catch (error: any) {
      console.error("Error fetching data", error.message);
      currentState = null;
      if (error.message.includes("Details: The access token expired.")) {
        setAuthToken(null);
      }
      timeoutInterval = 30000;
    }
    setPlaybackState(currentState);

    if (currentState?.context?.type === "playlist") {
      const playlistId = currentState.context.uri.split(":")[2];
      setCurrentPlaylistId(playlistId);
      fetchPlaylist(playlistId);
    }

    fetchTimer = setTimeout(() => fetchCurrentPlaybackState(currentState), timeoutInterval);
  }
  async function fetchPlaylist(playlistId: string) {
    if (!spotifyApi || !playlistId) {
      return;
    }

    if (!playlistMap.has(playlistId)) {
      // fetch playlist
      try {
        const response = await spotifyApi.getPlaylist(playlistId);
        const playlistData = response.body;
        console.log("playlist", playlistData);
        if (playlistData) {
          setPlaylistMap(playlistMap.set(playlistId, playlistData));
          fetchPlaylistTracks(playlistId);
        }
      } catch (error: any) {
        console.error("Error fetching data", error.message);
      }
    }
  }
  async function fetchPlaylistTracks(playlistId: string) {
    if (!spotifyApi || !playlistId || !playlistMap.has(playlistId)) {
      return;
    }
    const playlist = playlistMap.get(playlistId);
    if (playlist.tracks.total <= playlist.tracks.items.length) {
      // already have all the tracks
      return;
    }

    // the first 100 tracks are always included in the response, so we need to fetch the rest
    try {
      while (playlist.tracks.items.length < playlist.tracks.total) {
        console.log("fetching more tracks", playlist.tracks.items.length, playlist.tracks.total);
        const response = await spotifyApi.getPlaylistTracks(playlistId, {
          offset: playlist.tracks.items.length,
          limit: 100,
        });
        const tracks = response.body.items;
        console.log("tracks", tracks);
        if (tracks) {
          playlist.tracks.items = playlist.tracks.items.concat(tracks);
        }
      }
      setPlaylistMap(playlistMap.set(playlistId, playlist));
    } catch (error: any) {
      console.error("Error fetching data", error.message);
    }
  }

  useEffect(() => {
    fetchCurrentPlaybackState(playbackState);
  }, [spotifyApi]);

  return (
    <div className="App">
      <div className="app-grid">
        <div className="app-header">
          { !token && <Login /> }
        </div>
        <div className="app-sidebar">
          <Sidebar currentPlaylistId={currentPlaylistId} playlistMap={playlistMap} />
        </div>
        <div className="app-content">
          { playbackState &&
            <ShuffleAnalyzer playbackState={playbackState} playlistMap={playlistMap} />
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
