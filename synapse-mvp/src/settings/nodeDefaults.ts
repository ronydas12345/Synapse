import { getAppSettings } from './settingsStore';

export function defaultTrackNodeData(): Record<string, unknown> {
  const { defaultVolume, defaultPlayCount, defaultSpeed } = getAppSettings().nodes;
  return {
    videoId: '',
    songTitle: '',
    artist: '',
    album: '',
    startTime: 0,
    endTime: 0,
    duration: 0,
    volume: defaultVolume,
    speed: defaultSpeed,
    label: '',
    name: '',
    playCount: defaultPlayCount,
  };
}
