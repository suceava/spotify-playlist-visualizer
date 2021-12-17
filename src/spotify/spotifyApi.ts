import SpotifyWebApi from "spotify-web-api-node";

export async function getPlaylist(spotifyApi: SpotifyWebApi, playlistId: string, fetchAllTracks: boolean = true) {
  if (!spotifyApi) {
    return null;
  }

  // fetch playlist
  try {
    const response = await spotifyApi.getPlaylist(playlistId);
    let playlist = response.body;
    console.log("playlist", playlist);
    if (playlist && fetchAllTracks) {
      playlist = await getPlaylistTracks(spotifyApi, playlist);
    }
    return playlist;
  } catch (error: any) {
    console.error("Error fetching data", error.message);
    return null;
  }
}

export async function getPlaylistTracks(spotifyApi: SpotifyWebApi, playlist: any) {
  if (!spotifyApi || !playlist) {
    return null;
  }

  // fetch all tracks
  try {
    while (playlist.tracks.items.length < playlist.tracks.total) {
      console.log("fetching more tracks", playlist.tracks.items.length, playlist.tracks.total);
      const response = await spotifyApi.getPlaylistTracks(playlist.id, {
        offset: playlist.tracks.items.length,
        limit: 100,
      });
      const tracks = response?.body?.items;
      if (tracks) {
        playlist.tracks.items = playlist.tracks.items.concat(tracks);
      }
    }
    return playlist;
  } catch (error: any) {
    console.error("Error fetching data", error.message);
    return null;
  }
}

export async function getCurrentPlaybackState(spotifyApi: SpotifyWebApi) {
  if (!spotifyApi) {
    return null;
  }

  try {
    const response = await spotifyApi.getMyCurrentPlaybackState();
    const currentState = response.body;
    //console.log("current playback", currentState);
    return currentState;
  } catch (error: any) {
    console.error("Error fetching data", error.message);
    if (error.message.includes("Details: The access token expired.")) {
      throw new Error("The access token expired.");
    }
    return null;
  }
}

export async function getUserPlaylists(spotifyApi: SpotifyWebApi) {
  if (!spotifyApi) {
    return null;
  }

  try {
    const response = await spotifyApi.getUserPlaylists();
    const playlists = response.body;
    console.log("playlists", playlists);
    return playlists;
  } catch (error: any) {
    console.error("Error fetching data", error.message);
    return null;
  }
}
