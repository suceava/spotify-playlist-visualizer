import { API } from 'aws-amplify';
import { useCallback, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary'
import SpotifyWebApi from 'spotify-web-api-node';

import { Header } from './header/Header';
import { useStickyState } from './stickyState';
import WebPlayback from './WebPlayback'
import { Analyzer } from './analyzer/Analyzer';
import { PlaybackState } from './data/playbackState';
import { PlaylistData } from './data/playlistData';
import { PlayerControl } from './player/PlayerControl';
import { Sidebar } from './sidebar/Sidebar';
import {
  getCurrentPlaybackState,
  getPlaylist,
  getPlaylistTracks,
  getUserPlaylists
} from './spotify/spotifyApi';

import './App.css';

interface AuthResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  timestamp: number;
}

function App() {
  let search = window.localStorage.getItem('callback');

  const [callbackQuery, setCallbackQuery] = useState<string | null>(search);
  const [auth, setAuth] = useStickyState<AuthResponse | null>(null, 'auth');
  const [playlistData, setPlaylistData] = useStickyState<PlaylistData[]>([], 'playlistData');
  const [lastPlaylistDataName, setLastPlaylistDataName] = useStickyState<string>('', 'lastPlaylistDataName');
  const [isAnalyzing, setIsAnalyzing] = useStickyState<boolean>(false, 'isAnalyzing');
  const [spotifyApi, setSpotifyApi] = useState<SpotifyWebApi | null>(null);
  const [currentPlaybackState, setCurrentPlaybackState] = useState<PlaybackState | undefined>(undefined);
  const [playlistMap, setPlaylistMap] = useState<Map<string, any>>(new Map());
  const [currentPlaylist, setCurrentPlaylist] = useState<any>(null);
  const [fetchTimer, setFetchTimer] = useState<NodeJS.Timeout | null>(null);
  const [authTimer, setAuthTimer] = useState<NodeJS.Timeout | null>(null);
  const [currentPlaylistData, setCurrentPlaylistData] = useState<PlaylistData | undefined>(undefined);

  const setSpotifyApiToken = useCallback(
    (token?: string) => {
      const api = spotifyApi ? spotifyApi : (token ? new SpotifyWebApi() : null);
      if (api) {
        if (token) {
          api.setAccessToken(token);
        } else {
          api.resetAccessToken();
        }
      }
      setSpotifyApi(api);
    },
    [ setSpotifyApi ]
  );

  const setAuthToken = useCallback(
    (response: AuthResponse | null) => {
      setAuth(response);
      setSpotifyApiToken(response?.access_token);
    },
    [setAuth, setSpotifyApiToken]
  );

  const checkAuth = useCallback(
    () => {
      if (auth) {
        // expires_in is in seconds
        // check if token is expired or about to expire
        const expiresIn = auth.expires_in;
        const expiresAt = auth.timestamp + (expiresIn - 60) * 1000;
        const now = new Date().getTime();
        if (expiresAt <= now) {
          setCallbackQuery(`?refresh_token=${auth.refresh_token}`);
        } else {
          // set timer to check again when it's set to expire
          setAuthTimer(setTimeout(checkAuth, expiresAt - now));
        }
      }
    },
    [auth]
  );

  const logOut = useCallback(
    () => {
      if (fetchTimer) {
        clearInterval(fetchTimer);
        setFetchTimer(null);
      }
      if (authTimer) {
        clearTimeout(authTimer);
        setAuthTimer(null);
      }
      setAuthToken(null);
      setCurrentPlaybackState(undefined);
      setCurrentPlaylist(null);
      setCurrentPlaylistData(undefined);
    }, [fetchTimer]
  );

  useEffect(() => {
    async function fetchToken() {
      console.log('fetchToken', callbackQuery);
      if (callbackQuery) {
        // clear out the callback query string
        window.localStorage.removeItem('callback');
        setCallbackQuery(null);

        try {
          const response = await API.get('spotifyapp', `/auth/callback${callbackQuery}`, null);
          if (response && response.access_token) {
            const authResponse = {
              access_token: response.access_token,
              expires_in: response.expires_in,
              refresh_token: response.refresh_token || auth?.refresh_token,
              timestamp: new Date().getTime()
            }
            setAuthToken(authResponse);
          }
        } catch (e) {
          // error getting token => clear out token from state
          console.error('error', e);
          setAuthToken(null);
        }
      } else {
        setSpotifyApiToken(auth?.access_token);
        if (!authTimer) {
          checkAuth();
        }
      }
    }
    fetchToken();

    return () => {
      // stope the auth timer
      if (authTimer) {
        clearTimeout(authTimer);
        setAuthTimer(null);
      }
    }
  }, [callbackQuery, auth, setAuthToken, setSpotifyApiToken]);

  async function fetchCurrentPlaybackState(state?: PlaybackState) {
    let progressMs = 0, durationMs = 0;
    let lastTrackId, lastPlaylistUri;
    let timeoutInterval = 10000;

    if (!spotifyApi) {
      return;
    }

    if (state && state.playback) {
      lastTrackId = state.playback.item?.id;
      lastPlaylistUri = state.playback.context?.uri;
      progressMs = state.playback.progress_ms || 0;
      durationMs = state.playback.item?.duration_ms || 0;
    }

    if (durationMs > 0 && (durationMs - progressMs) < timeoutInterval) {
      // less than 10 seconds left => set timeout to remaining time
      timeoutInterval = durationMs - progressMs + 10;
    }

    let newPlaybackResponse: SpotifyApi.CurrentPlaybackResponse | null;
    try {
      newPlaybackResponse = await getCurrentPlaybackState(spotifyApi);
    } catch (error: any) {
      if (error.message.includes("The access token expired.")) {
        setAuthToken(null);
      }
      newPlaybackResponse = null;
      timeoutInterval = 30000;
    }

    // new playback state
    const newPlaybackState = newPlaybackResponse ? {
      playback: newPlaybackResponse,
      hasTrackChanged: lastTrackId !== newPlaybackResponse?.item?.id,
      hasPlaylistChanged: lastPlaylistUri !== newPlaybackResponse?.context?.uri
    } : undefined;
    setCurrentPlaybackState(newPlaybackState);

    if (newPlaybackResponse?.context?.type === "playlist") {
      const playlistId = newPlaybackResponse.context.uri.split(":")[2];
      fetchPlaylist(playlistId);
    }

    const timer = setTimeout(() => fetchCurrentPlaybackState(newPlaybackState), timeoutInterval);
    setFetchTimer(timer);
  }
  async function fetchPlaylist(playlistId: string) {
    if (!spotifyApi || !playlistId || playlistMap.has(playlistId)) {
      return;
    }

    // fetch playlist
    let playlist = await getPlaylist(spotifyApi, playlistId, false);
    if (playlist) {
      // update state with playlist before fetching tracks
      setPlaylistMap(playlistMap.set(playlistId, playlist));
      setCurrentPlaylist(playlist);
      // fetch tracks
      playlist = await getPlaylistTracks(spotifyApi, playlist);
      setPlaylistMap(playlistMap.set(playlistId, playlist));
      setCurrentPlaylist(playlist);
    }
  }
  async function fetchUserPlaylists() {
    if (!spotifyApi) {
      return;
    }

    const userPlaylists = await getUserPlaylists(spotifyApi);
    if (userPlaylists) {
    }
  }

  useEffect(() => {
    // fetch user's playlists
    if (spotifyApi) {
      fetchUserPlaylists();
    }
  }, [spotifyApi]);

  useEffect(() => {
    // initial playback state fetch
    if (spotifyApi && auth?.access_token && !fetchTimer) {
      // it will start a timer that will fetch the playback state every 10 seconds
      fetchCurrentPlaybackState(currentPlaybackState);
    }

    return () => {
      // stop the timer when the component unmounts
      if (fetchTimer) {
        clearTimeout(fetchTimer);
      }
    };
  }, [spotifyApi]);

  useEffect(() => {
    if (!currentPlaylist) {
      return;
    }

    // get current analysis data
    let currentData = currentPlaylistData;
    if (!currentData) {
      // get the playlist data by the last name used
      currentData = playlistData.find(data => data.name === lastPlaylistDataName);
      if (!currentData || currentData.playlist.id !== currentPlaylist.id) {
        // new playlist analysis
        currentData = {
          name: `${currentPlaylist.name} ${new Date().toLocaleString()}`,
          playlist: currentPlaylist,
          scatterData: [],
          timestamp: new Date()
        };
        playlistData.push(currentData);
        setPlaylistData(Array.from(playlistData));
        setLastPlaylistDataName(currentData.name);
      }
      setCurrentPlaylistData(currentData);
    } else {
      if (currentData.playlist.id !== currentPlaylist.id) {
        // playlist changed => new playlist analysis
        currentData = {
          name: `${currentPlaylist.name} ${new Date().toLocaleString()}`,
          playlist: currentPlaylist,
          scatterData: [],
          timestamp: new Date()
        };
        playlistData.push(currentData);
        setPlaylistData(Array.from(playlistData));
        setLastPlaylistDataName(currentData.name);
        setCurrentPlaylistData(currentData);
      }
    }
  }, [currentPlaylist]);

  return (
    <div className="App">
      <div className="app-grid">
        <div className="app-header">
          <Header token={auth?.access_token} logOut={logOut} />
        </div>
        <div className="app-sidebar">
          <Sidebar currentPlaylist={currentPlaylist} playlistMap={playlistMap} />
        </div>
        <div className="app-content">
          { currentPlaybackState && currentPlaylist && currentPlaylistData &&
            <Analyzer
              playbackState={currentPlaybackState}
              playlist={currentPlaylist}
              currentData={currentPlaylistData}
              playlistData={playlistData}
              setPlaylistData={setPlaylistData}
            />
          }
          { auth?.access_token && <WebPlayback token={auth?.access_token} setToken={setAuthToken} />}
        </div>
        <div className="app-footer">
          { currentPlaybackState && 
            <ErrorBoundary FallbackComponent={() => (<div>Error</div>)}>
              <PlayerControl playbackState={currentPlaybackState} />
            </ErrorBoundary>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
