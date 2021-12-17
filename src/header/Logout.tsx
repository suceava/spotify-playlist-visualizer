import './header.css';

interface LogoutProps {
  logOut: () => void;
}

export function Logout({ logOut }: LogoutProps) {

  return (
    <div className="header-logout">
      <button onClick={logOut}>Log out</button>
    </div>
  );
}
