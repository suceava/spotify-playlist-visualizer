import { Navigate } from "react-router-dom";

export function Callback() {
  window.localStorage.setItem('callback', window.location.search);
  return <Navigate to="/" />;
}
