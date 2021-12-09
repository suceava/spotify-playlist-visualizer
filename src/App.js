import { API } from 'aws-amplify';
import { useState, useEffect } from 'react';

import Login from './Login';
import WebPlayback from './WebPlayback'

import './App.css';

function App(props) {
  const { search } = props;
  const [token, setToken] = useState(null);

  console.log('props', props);

  useEffect(() => {
//    const token = localStorage.getItem('token');

    async function fetchToken() {
      if (search) {
        try {
          const response = await API.get('spotifyapp', `/auth/callback${search}`);
          console.log('response', response);
          if (response && response.access_token) {
            setToken(response.access_token);
  //          localStorage.setItem('token', response.token);
          }
        } catch (e) {
          console.error('error', e);
        }
      }
    }
    fetchToken();
  }, [search]);

  return (
    <div className="App">
      { !token && <Login /> }
      { token && <WebPlayback token={token} />}
    </div>
  );
}

export default App;
