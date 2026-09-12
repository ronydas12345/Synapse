import { getAppSettings } from './settingsStore';

export function defaultTrackNodeData(): Record<string, unknown> {
  const { defaultVolume, defaultPlayCount } = getAppSettings().nodes;
  return {
    videoId: '',
    songTitle: '',
    artist: '',
    album: '',
    startTime: 0,
    endTime: 0,
    duration: 0,
    volume: defaultVolume,
    label: '',
    playCount: defaultPlayCount,
  };
}
