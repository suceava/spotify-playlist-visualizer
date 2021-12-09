import { API } from 'aws-amplify';
import React from 'react';

import awsconfig from './aws-exports';

function Login(props) {
  const { setToken } = props;
  console.log(awsconfig);

  const loginUrl = `${awsconfig.aws_cloud_logic_custom[0].endpoint}/auth/login`;

  return (
    <div className="App">
      <header className="App-header">
        <a className="btn-spotify" href={loginUrl} >
          Login with Spotify 
        </a>
      </header>
    </div>
  );
}

export default Login;
