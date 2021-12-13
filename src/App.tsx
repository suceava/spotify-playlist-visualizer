import { API } from 'aws-amplify';
import { useCallback, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary'
import SpotifyWebApi from 'spotify-web-api-node';

import Login from './Login';
import { useStickyState } from './stickyState';
import WebPlayback from './WebPlayback'

import './App.css';
import { PlayerControl } from './player/PlayerControl';

function App() {
  const search = window.localStorage.getItem('callback');

  const [token, setToken] = useStickyState<string | null>(null, 'token');
  const [spotifyApi, setSpotifyApi] = useState<SpotifyWebApi | null>(null);
  const [playbackState, setPlaybackState ] = useState<any>(null);

  const setSpotifyApiToken = useCallback(
    (token: string | null) => {
      const api = token ? new SpotifyWebApi() : null;
      if (api) {
        api.setAccessToken(token || '');
      }
      setSpotifyApi(api);
      console.log('setSpotifyApiToken', api);
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

  async function fetchData(state: any) {
    let progressMs = 0, durationMs = 0;
    let currentState: any = null;
    let timeoutInterval = 10000;

    if (!spotifyApi) {
      return;
    }

    if (state && state.body) {
      progressMs = state.body.progress_ms;
      durationMs = state.body.item?.duration_ms || 0;
    }

    if (durationMs > 0 && (durationMs - progressMs) < timeoutInterval) {
      timeoutInterval = durationMs - progressMs + 10;
      console.log(`Timeout interval set to ${timeoutInterval}`);
    }

    try {
      currentState = await spotifyApi.getMyCurrentPlaybackState();
      console.log("current playback", currentState);
    } catch (error) {
      console.error("Error fetching data", error);
      currentState = null;
      timeoutInterval = 30000;
    }
    setPlaybackState(currentState);

    fetchTimer = setTimeout(() => fetchData(currentState), timeoutInterval);
  }

  useEffect(() => {
    fetchData(playbackState);
  }, [spotifyApi]);

  return (
    <div className="App">
      <div className="app-grid">
        <div className="app-header">
          { !token && <Login /> }
        </div>
        <div className="app-sidebar">
          SIDEBAR
        </div>
        <div className="app-content">
          { token && <WebPlayback token={token} setToken={setAuthToken} />}
        </div>
        <div className="app-footer">
          { spotifyApi && 
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
