import { API } from 'aws-amplify';
import { useCallback, useEffect, useState } from 'react';
import ReactDOM from "react-dom";
import { ErrorBoundary } from 'react-error-boundary'
import SpotifyWebApi from 'spotify-web-api-node';

import { Header } from './header/Header';
import { useStickyState } from './stickyState';
import WebPlayback from './WebPlayback'
import { Analyzer } from './analyzer/Analyzer';
import { PlaybackState } from './data/playbackState';
import { PlaylistData, getPlaylistInfo } from './data/playlistData';
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
  const [isAnalyzing, setIsAnalyzing] = useStickyState<boolean>(true, 'isAnalyzing');
  const [spotifyApi, setSpotifyApi] = useState<SpotifyWebApi | null>(null);
  const [currentPlaybackState, setCurrentPlaybackState] = useState<PlaybackState | undefined>(undefined);
  const [playlistMap, setPlaylistMap] = useState<Map<string, any>>(new Map());
  const [currentPlaylist, setCurrentPlaylist] = useState<SpotifyApi.SinglePlaylistResponse | null>(null);
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
    (forceRefresh: boolean = false) => {
      // clear timer
      setAuthTimer(null);

      if (auth) {
        // expires_in is in seconds
        // check if token is expired or about to expire
        const expiresIn = auth.expires_in;
        const expiresAt = auth.timestamp + (expiresIn - 60) * 1000;
        const now = new Date().getTime();
        if (forceRefresh || expiresAt <= now) {
          console.warn('Token is expired, refreshing...', now);
          setCallbackQuery(`?refresh_token=${auth.refresh_token}`);
        } else {
          // set timer to check again when it's set to expire
          console.log(`Auth token will expire in ${(expiresAt - now) / 1000} seconds`, now);
          setAuthTimer(setTimeout(checkAuth, expiresAt - now));
        }
      } else {
        // auth is null => stop fetching
        if (fetchTimer) {
          clearInterval(fetchTimer);
          setFetchTimer(null);
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

  const toggleAnalyze = useCallback(
    () => {
      setIsAnalyzing(!isAnalyzing);
    },
    [isAnalyzing]
  );

  const setUpPlaylistData = useCallback(
    (playlist: SpotifyApi.SinglePlaylistResponse | null, currentPlaylistDataName: string) => {
      if (!isAnalyzing || !playlist) {
        return;
      }

      // get the playlist data by the last name used
      let currentData = playlistData.find(data => data.name === currentPlaylistDataName);
      if (!currentData || currentData.playlist.id !== playlist.id) {
        // new playlist analysis
        console.log(`Analyzing new playlist: ${playlist.name}`);
        currentData = {
          name: `${playlist.name} - ${new Date().toLocaleString()}`,
          playlist: getPlaylistInfo(playlist),
          scatterData: [],
          timestamp: new Date().getTime()
        };
        playlistData.push(currentData);
        setPlaylistData(Array.from(playlistData));
        setLastPlaylistDataName(currentData.name);
      }
      setCurrentPlaylistData(currentData);

      // // get current analysis data
      // let currentData = currentPlaylistData;
      // if (!currentData) {
      //   // get the playlist data by the last name used
      //   currentData = playlistData.find(data => data.name === lastPlaylistDataName);
      //   if (!currentData || currentData.playlist.id !== newPlaylistId) {
      //     // new playlist analysis
      //     currentData = {
      //       name: `${currentPlaylist.name} - ${new Date().toLocaleString()}`,
      //       playlist: getPlaylistInfo(currentPlaylist),
      //       scatterData: [],
      //       timestamp: new Date().getTime()
      //     };
      //     playlistData.push(currentData);
      //     setPlaylistData(Array.from(playlistData));
      //     setLastPlaylistDataName(currentData.name);
      //   }
      //   setCurrentPlaylistData(currentData);
      // } else {
      //   if (currentData.playlist.id !== newPlaylistId) {
      //     // playlist changed => new playlist analysis
      //     currentData = {
      //       name: `${currentPlaylist.name} - ${new Date().toLocaleString()}`,
      //       playlist: getPlaylistInfo(currentPlaylist),
      //       scatterData: [],
      //       timestamp: new Date().getTime()
      //     };
      //     playlistData.push(currentData);
      //     setPlaylistData(Array.from(playlistData));
      //     setLastPlaylistDataName(currentData.name);
      //     setCurrentPlaylistData(currentData);
      //   }
      // }
    },
    [isAnalyzing, playlistData],
  );

  useEffect(() => {
    async function fetchToken() {
      if (callbackQuery) {
        try {
          // fetch the token from the callback query string
          const response = await API.get('spotifyapp', `/auth/callback${callbackQuery}`, null);
          if (response && response.access_token) {
            const authResponse = {
              access_token: response.access_token,
              expires_in: response.expires_in - 3000,
              refresh_token: response.refresh_token || auth?.refresh_token,
              timestamp: new Date().getTime()
            }
            setAuthToken(authResponse);
          } else {
            console.error('No access token returned from Spotify', response);
            setAuthToken(null);
          }
        } catch (e) {
          // error getting token => clear out token from state
          console.error('error', e);
          setAuthToken(null);
        } finally {
          // clear out the callback query string
          window.localStorage.removeItem('callback');
          setCallbackQuery(null);
        }
      } else {
        // no callback query string => start up auth refresh timer
        if (!spotifyApi) {
          setSpotifyApiToken(auth?.access_token);
        }
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
  }, [callbackQuery, setAuthToken, setSpotifyApiToken]);

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
        checkAuth(true);
        return;
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
      const playlistId = newPlaybackResponse?.context?.uri.split(":")[2];
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
    let playlist: SpotifyApi.SinglePlaylistResponse | null = null;
    try {
      playlist = await getPlaylist(spotifyApi, playlistId, false);
    } catch (error: any) {
      if (error.message.includes("The access token expired.")) {
        checkAuth(true);
        return;
      }
    }
    if (playlist) {
      ReactDOM.unstable_batchedUpdates(() => {
        // must have all state update bached up
        if (currentPlaybackState?.hasPlaylistChanged) {
          setUpPlaylistData(playlist, lastPlaylistDataName);
        }

        // update state with playlist before fetching tracks
        setPlaylistMap(playlistMap.set(playlistId, playlist));
        setCurrentPlaylist(playlist);
      });
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

    let userPlaylists;
    try {
      userPlaylists = await getUserPlaylists(spotifyApi);
    } catch (error: any) {
      if (error.message.includes("The access token expired.")) {
        checkAuth(true);
        return;
      }
    }
    if (userPlaylists) {
    }
  }

  useEffect(() => {
    // fetch user's playlists
    if (spotifyApi) {
      fetchUserPlaylists();
    }
  }, []);

  useEffect(() => {
    // initial playback state fetch
    console.log('start fetching playback state', auth, spotifyApi, fetchTimer);
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
    setUpPlaylistData(currentPlaylist, lastPlaylistDataName);
  }, [currentPlaylist, isAnalyzing, lastPlaylistDataName]);

  return (
    <div className="App">
      <div className="app-grid">
        <div className="app-header">
          <Header
            token={auth?.access_token}
            logOut={logOut}
            isAnalyzing={isAnalyzing}
            toggleAnalyze={toggleAnalyze}
          />
        </div>
        <div className="app-sidebar">
          { auth &&
            <Sidebar
              currentPlaylist={currentPlaylist}
              playlistMap={playlistMap}
              playlistData={playlistData}
              isAnalyzing={isAnalyzing}
              setCurrentPlaylistData={setCurrentPlaylistData}
            />
          }
        </div>
        <div className="app-content">
          { auth?.access_token && currentPlaylistData &&
            <Analyzer
              isAnalyzing={isAnalyzing}
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
