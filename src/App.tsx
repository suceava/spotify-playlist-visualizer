import { API } from 'aws-amplify';
import { useCallback, useEffect, useState } from 'react';
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

  const setSpotifyApiToken = useCallback(
    (token: string | null) => {
      // token = null;
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
          { spotifyApi && <PlayerControl spotifyApi={spotifyApi} />}
        </div>
      </div>
    </div>
  );
}

export default App;
