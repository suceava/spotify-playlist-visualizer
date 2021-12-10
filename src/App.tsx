import { API } from 'aws-amplify';
import { useEffect } from 'react';

import Login from './Login';
import { useStickyState } from './stickyState';
import WebPlayback from './WebPlayback'

import './App.css';

function App() {
  const search = window.localStorage.getItem('callback');
  const [token, setToken] = useStickyState(null, 'token');

  useEffect(() => {
    async function fetchToken() {
      if (search) {
        // clear out the callback query string
        window.localStorage.removeItem('callback');

        try {
          const response = await API.get('spotifyapp', `/auth/callback${search}`, null);
          console.log('response', response);
          if (response && response.access_token) {
            setToken(response.access_token);
          }
        } catch (e) {
          // error getting token => clear out token from state
          console.error('error', e);
          setToken(null);
        }
      }
    }
    fetchToken();
  }, [search, setToken]);

  return (
    <div className="App">
      { !token && <Login /> }
      { token && <WebPlayback token={token} />}
    </div>
  );
}

export default App;
