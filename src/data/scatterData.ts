
export interface ScatterData {
  // index of track within the playlist
  trackIndex: number;
  // index of track within shuffle - when the track was played
  playIndex: number;
  y: number;
  count: number;
  timestamp: number;
  track: any;
}

export function getScatterDataCount(scatterDataArray: ScatterData[]) {
  return scatterDataArray.reduce((acc, cur) => { return acc + (cur ? 1 : 0); }, 0);
}

export function updateScatterData(scatterDataArray: ScatterData[], trackIndex: number, track: any) {
  if (!scatterDataArray) {
    return;
  }
  const data = scatterDataArray[trackIndex];
  if (data) {
    data.count += 1;
  } else {
    scatterDataArray[trackIndex] = {
      trackIndex,
      playIndex: getScatterDataCount(scatterDataArray) + 1,
      y: 1,
      count: 1,
      timestamp: new Date().getTime(),
      track
    };
  }
}
