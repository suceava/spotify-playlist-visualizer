import React from 'react';

import awsconfig from './aws-exports';

function Login(props) {
  const loginUrl = `${awsconfig.aws_cloud_logic_custom[0].endpoint}/auth/login`;

  return (
    <div className="btn-spotify">
      <a href={loginUrl} >
        <div>
          <span>LOGIN WITH SPOTIFY</span>
        </div>
      </a>
    </div>
  );
}

export default Login;
