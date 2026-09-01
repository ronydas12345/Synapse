export type CaptureMode = 'display' | 'microphone';

type DisplayMediaExtra = DisplayMediaStreamOptions & {
  preferCurrentTab?: boolean;
  selfBrowserSurface?: string;
  systemAudio?: string;
};

export function browserCaptureProfile(): {
  preferMic: boolean;
  label: string;
} {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  const firefox = /Firefox\//.test(ua);
  const safari = /Safari\//.test(ua) && !/Chrome|Chromium|Edg\//.test(ua);
  if (firefox) {
    return {
      preferMic: true,
      label: 'Firefox can’t capture tab audio — use the microphone (play through speakers)',
    };
  }
  if (safari) {
    return {
      preferMic: true,
      label: 'Safari can’t capture tab audio — use the microphone (play through speakers)',
    };
  }
  return {
    preferMic: false,
    label: 'Pick this tab and enable audio',
  };
}

function stripVideoTracks(stream: MediaStream): MediaStream {
  for (const track of stream.getVideoTracks()) {
    track.stop();
    stream.removeTrack(track);
  }
  return stream;
}

async function tryDisplayAudio(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error('Screen capture is not available');
  }

  const attempts: DisplayMediaExtra[] = [
    {
      video: { width: 16, height: 16, frameRate: 1 },
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
      preferCurrentTab: true,
      selfBrowserSurface: 'include',
      systemAudio: 'include',
    },
    {
      video: true,
      audio: true,
    },
  ];

  let lastError: unknown;
  for (const opts of attempts) {
    try {
      const stream = stripVideoTracks(
        await navigator.mediaDevices.getDisplayMedia(opts)
      );
      if (stream.getAudioTracks().length > 0) return stream;
      stream.getTracks().forEach((t) => t.stop());
      // Picker succeeded but no audio (Firefox/Safari ignore display audio).
      // Do not open a second share dialog.
      throw new Error(
        'This browser did not share audio. Use the microphone instead.'
      );
    } catch (err) {
      lastError = err;
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        throw err;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('No audio track from window/tab share');
}

export async function captureMicrophone(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Microphone capture is not available');
  }
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });
}

export async function capturePlaybackAudio(
  mode: CaptureMode
): Promise<MediaStream> {
  if (mode === 'microphone') return captureMicrophone();
  return tryDisplayAudio();
}
