import awsconfig from '../aws-exports';

import './header.css';

export function Login() {
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
