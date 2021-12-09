import { API } from 'aws-amplify';
import React from 'react';

function Login(props) {
  const { setToken } = props;


  return (
    <div className="App">
      <header className="App-header">
        <a className="btn-spotify" href="/auth/login" >
          Login with Spotify 
        </a>
      </header>
    </div>
  );
}

export default Login;
