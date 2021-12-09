import { useState, useEffect } from 'react';
import Login from './Login';
import './App.css';

function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
  }, []);

  return (
    <div className="App">
      { token ? <h1>You are logged in</h1> : <Login setToken={setToken} /> }
    </div>
  );
}

export default App;
