import { Login } from './Login';
import { Logout } from './Logout';

import './header.css';

export interface HeaderProps {
  token: string | null;
  logOut: () => void;
}

export function Header({token, logOut}: HeaderProps) {

  return (
    <div className="header">
      <div className="header-title">
        { !token && <Login /> }
      </div>
      <div className="header-menu">
        { token && <Logout logOut={logOut} /> }
      </div>
    </div>
  );
}
