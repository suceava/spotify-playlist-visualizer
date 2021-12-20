import { Login } from './Login';
import { Logout } from './Logout';

import './header.css';

export interface HeaderProps {
  token?: string;
  logOut: () => void;
  isAnalyzing: boolean;
  toggleAnalyze: () => void;
}

export function Header({token, logOut, isAnalyzing, toggleAnalyze}: HeaderProps) {

  return (
    <div className="header">
      <div className="header-title">
        { !token && <Login /> }
        {/* { token &&
          <button className="btn-analyze" onClick={toggleAnalyze}>{isAnalyzing ? "Stop Analyzing": "Start Analyzing"}</button>
        } */}
      </div>
      <div className="header-menu">
        { token && <Logout logOut={logOut} /> }
      </div>
    </div>
  );
}
