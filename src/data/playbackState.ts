export interface PlaybackState {
  playback: SpotifyApi.CurrentPlaybackResponse;
  hasTrackChanged: boolean;
  hasPlaylistChanged: boolean;
}
