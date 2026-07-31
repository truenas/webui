import { fakeAsync, tick, discardPeriodicTasks, flushMicrotasks } from '@angular/core/testing';
import { MatTabGroup } from '@angular/material/tabs';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import Hls from 'hls.js';
import { MockComponent } from 'ng-mocks';
import { of, Subject, throwError } from 'rxjs';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { HarborAssistantCameraComponent } from 'app/pages/harbor-assistant/camera/harbor-assistant-camera.component';
import { HarborAssistantContentApiService } from 'app/pages/harbor-assistant/shared/harbor-assistant-content-api.service';
import {
  HarborAssistantCameraLiveSessionResponse,
  HarborAssistantHarborLinkCapabilitiesResponse,
  HarborAssistantSearchCameraStateResponse,
  HarborAssistantSearchDvrStatusResponse,
  HarborAssistantSearchDvrTimelineResponse,
  HarborAssistantSearchResponse,
  HarborAssistantSearchSnapshotTaskResponse,
} from 'app/pages/harbor-assistant/shared/harbor-assistant.interface';

type HlsLiveStatus = 'stopped' | 'starting' | 'live' | 'degraded';

describe('Harbor Assistant camera component', () => {
  let spectator: Spectator<HarborAssistantCameraComponent>;
  let snapshotSubject$: Subject<HarborAssistantSearchSnapshotTaskResponse>;
  let scrollIntoViewSpy: jest.Mock;
  let api: Partial<Record<keyof HarborAssistantContentApiService, jest.Mock>>;

  const createComponent = createComponentFactory({
    component: HarborAssistantCameraComponent,
    imports: [
      MockComponent(PageHeaderComponent),
    ],
    providers: [
      {
        provide: HarborAssistantContentApiService,
        useFactory: (): Partial<Record<keyof HarborAssistantContentApiService, jest.Mock>> => api,
      },
    ],
  });

  beforeEach(() => {
    snapshotSubject$ = new Subject<HarborAssistantSearchSnapshotTaskResponse>();
    scrollIntoViewSpy = jest.fn();
    (Element.prototype as unknown as { scrollIntoView: jest.Mock }).scrollIntoView = scrollIntoViewSpy;
    api = {
      cameraState: jest.fn(() => of(cameraState())),
      dvrStatus: jest.fn(() => of(dvrStatus())),
      dvrTimeline: jest.fn(() => of(dvrTimeline())),
      startCameraLiveSession: jest.fn(() => of(liveSession())),
      renewCameraLiveSession: jest.fn(() => of(liveSession())),
      stopCameraLiveSession: jest.fn(() => of(liveSession({ status: 'stopped', playlist_url: null, playlist_ready: false }))),
      cameraLiveStatus: jest.fn(() => of(liveSession())),
      harborLinkCapabilities: jest.fn(() => of(harborLinkCapabilities())),
      createSnapshotTask: jest.fn(() => snapshotSubject$.asObservable()),
      startDvrRecording: jest.fn(() => of(dvrStatus('recording'))),
      stopDvrRecording: jest.fn(() => of(dvrStatus('stopped'))),
      search: jest.fn(() => of(searchResponse())),
      previewUrl: jest.fn((path: string) => `/api/beacon/knowledge/preview?path=${encodeURIComponent(path)}`),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses snapshot polling instead of long-running MJPEG for stream-only cameras', fakeAsync(() => {
    api.cameraState = jest.fn(() => of(cameraState({
      snapshotUrl: null,
      snapshotCapability: false,
    })));
    spectator = createComponent();
    const componentState = spectator.component as unknown as {
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
    };
    componentState.hlsLiveStatus.set('starting');

    const liveUrl = spectator.component.selectedLiveUrl();

    expect(liveUrl).toContain('/api/harbor-beacon/cameras/cam-1/snapshot.jpg?ts=');
    expect(liveUrl).not.toContain('live.mjpeg');
    discardPeriodicTasks();
  }));

  it('keeps the live panel black and stops snapshot polling before play live', fakeAsync(() => {
    spectator = createComponent();
    const componentState = spectator.component as unknown as {
      liveSnapshotToken: () => number;
    };
    const token = componentState.liveSnapshotToken();

    spectator.detectChanges();
    tick(3000);
    spectator.detectChanges();

    expect(spectator.component.selectedLiveUrl()).toBeNull();
    expect(spectator.component.livePreviewErrorMessage()).toBeNull();
    expect(componentState.liveSnapshotToken()).toBe(token);
    expect(spectator.query('.live-panel img')).toBeNull();
    expect(spectator.query('.live-panel video')).toBeNull();
    discardPeriodicTasks();
  }));

  it('returns the live panel to black after live playback stops', fakeAsync(() => {
    spectator = createComponent();
    const componentState = spectator.component as unknown as {
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
    };
    componentState.hlsLiveStatus.set('starting');

    expect(spectator.component.selectedLiveUrl()).not.toBeNull();

    componentState.hlsLiveStatus.set('stopped');
    spectator.detectChanges();

    expect(spectator.component.selectedLiveUrl()).toBeNull();
    expect(spectator.component.livePreviewErrorMessage()).toBeNull();
    expect(spectator.query('.live-panel img')).toBeNull();
    expect(spectator.query('.live-panel video')).toBeNull();
    discardPeriodicTasks();
  }));

  it('starts a same-origin HLS live session on demand', fakeAsync(() => {
    spectator = createComponent();

    spectator.component.startLive();

    expect(api.startCameraLiveSession).toHaveBeenCalledWith('cam-1', 'sub');
    expect(spectator.component.liveModeLabel()).toBe('Starting sub stream');
    discardPeriodicTasks();
  }));

  it('negotiates WHEP and attaches the low-latency WebRTC stream', async () => {
    const originalPeerConnection = globalThis.RTCPeerConnection;
    const originalFetch = globalThis.fetch;
    const videoTrack = { id: 'video-track' } as MediaStreamTrack;
    const mediaStream = {
      addTrack: jest.fn(),
      getTracks: jest.fn(() => [videoTrack]),
    } as unknown as MediaStream;
    const peerConnection = {
      addEventListener: jest.fn(),
      addTransceiver: jest.fn(),
      close: jest.fn(),
      connectionState: 'connected',
      createOffer: jest.fn(() => Promise.resolve({ type: 'offer', sdp: 'offer-sdp' })),
      iceGatheringState: 'complete',
      localDescription: null as RTCSessionDescriptionInit | null,
      onconnectionstatechange: null as (() => void) | null,
      ontrack: null as ((event: RTCTrackEvent) => void) | null,
      removeEventListener: jest.fn(),
      setLocalDescription: jest.fn((description: RTCSessionDescriptionInit) => {
        peerConnection.localDescription = description;
        return Promise.resolve();
      }),
      setRemoteDescription: jest.fn(() => Promise.resolve()),
    };
    const peerConnectionFactory = jest.fn(() => peerConnection);
    const fetchMock = jest.fn(() => Promise.resolve({
      headers: {
        get: (name: string) => {
          return name === 'Location' ? '/api/harbor-link/media/harbor-live-test/whep/session-1' : null;
        },
      },
      ok: true,
      status: 201,
      text: () => Promise.resolve('answer-sdp'),
    }));
    Object.defineProperty(globalThis, 'RTCPeerConnection', {
      configurable: true,
      value: peerConnectionFactory,
      writable: true,
    });
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
      writable: true,
    });
    spectator = createComponent();
    let decodedFrame: (() => void) | null = null;
    const video = fakeLiveVideo({
      requestVideoFrameCallback: (callback) => {
        decodedFrame = callback;
        return 1;
      },
      srcObject: null,
      volume: 1,
    });
    const componentState = spectator.component as unknown as {
      attachWhepPlayback: (video: HTMLVideoElement, url: string, token: number) => Promise<void>;
      liveControlPlaybackMode: () => string;
      liveVideo?: { nativeElement: HTMLVideoElement };
      webrtcAttachToken: number;
    };
    componentState.liveVideo = { nativeElement: video };
    componentState.webrtcAttachToken = 1;

    try {
      await componentState.attachWhepPlayback(
        video,
        '/api/harbor-link/media/harbor-live-test/whep',
        componentState.webrtcAttachToken,
      );

      expect(fetchMock).toHaveBeenCalledWith('/api/harbor-link/media/harbor-live-test/whep', expect.objectContaining({
        body: 'offer-sdp',
        method: 'POST',
        signal: expect.any(AbortSignal),
      }));
      peerConnection.ontrack?.({ streams: [mediaStream], track: videoTrack } as RTCTrackEvent);

      expect(video.srcObject).toBe(mediaStream);
      expect(video.play).toHaveBeenCalled();
      expect(componentState.liveControlPlaybackMode()).toBe('hls-fallback');

      spectator.component.onLiveVideoPlaying();

      expect(componentState.liveControlPlaybackMode()).toBe('hls-fallback');
      decodedFrame?.();

      expect(componentState.liveControlPlaybackMode()).toBe('webrtc');
    } finally {
      Object.defineProperty(globalThis, 'RTCPeerConnection', {
        configurable: true,
        value: originalPeerConnection,
        writable: true,
      });
      Object.defineProperty(globalThis, 'fetch', {
        configurable: true,
        value: originalFetch,
        writable: true,
      });
    }
  });

  it('keeps one MediaStream when WebRTC audio and video tracks arrive separately', () => {
    spectator = createComponent();
    const videoTrack = { id: 'video-track' } as MediaStreamTrack;
    const audioTrack = { id: 'audio-track' } as MediaStreamTrack;
    const attachedTracks = [videoTrack];
    const primaryStream = {
      addTrack: jest.fn((track: MediaStreamTrack) => attachedTracks.push(track)),
      getTracks: jest.fn(() => attachedTracks),
    } as unknown as MediaStream;
    const secondaryStream = {
      addTrack: jest.fn(),
      getTracks: jest.fn(() => [audioTrack]),
    } as unknown as MediaStream;
    const video = fakeLiveVideo({ srcObject: null });
    const componentState = spectator.component as unknown as {
      attachWebRtcTrack: (target: HTMLVideoElement, event: RTCTrackEvent) => void;
    };

    componentState.attachWebRtcTrack(video, {
      streams: [primaryStream],
      track: videoTrack,
    } as RTCTrackEvent);
    componentState.attachWebRtcTrack(video, {
      streams: [secondaryStream],
      track: audioTrack,
    } as RTCTrackEvent);

    expect(video.srcObject).toBe(primaryStream);
    expect(primaryStream.addTrack).toHaveBeenCalledWith(audioTrack);
    expect(secondaryStream.addTrack).not.toHaveBeenCalled();
  });

  it('retries an aborted WebRTC play request without falling back to HLS', fakeAsync(() => {
    spectator = createComponent();
    const stream = {
      addTrack: jest.fn(),
      getTracks: jest.fn(() => []),
    } as unknown as MediaStream;
    const play = jest.fn()
      .mockRejectedValueOnce({ name: 'AbortError' })
      .mockResolvedValue(undefined);
    const video = fakeLiveVideo({ play, srcObject: stream });
    const componentState = spectator.component as unknown as {
      hlsLiveError: () => string | null;
      requestWebRtcPlayback: (target: HTMLVideoElement, token: number) => void;
      webrtcAttachToken: number;
      webrtcMediaStream: MediaStream | null;
    };
    componentState.webrtcAttachToken = 1;
    componentState.webrtcMediaStream = stream;

    componentState.requestWebRtcPlayback(video, componentState.webrtcAttachToken);
    flushMicrotasks();
    tick(100);
    flushMicrotasks();

    expect(play).toHaveBeenCalledTimes(2);
    expect(componentState.hlsLiveError()).toBeNull();
  }));

  it('aborts WHEP negotiation when the total deadline expires', fakeAsync(() => {
    spectator = createComponent();
    const componentState = spectator.component as unknown as {
      runWebRtcNegotiationWithDeadline: (
        negotiation: Promise<void>,
        abortController: AbortController,
      ) => Promise<void>;
    };
    const abortController = new AbortController();
    const negotiation = new Promise<void>(() => {
      // Keep negotiation pending until the total deadline aborts it.
    });
    let failure: unknown = null;

    componentState.runWebRtcNegotiationWithDeadline(
      negotiation,
      abortController,
    ).catch((error: unknown) => {
      failure = error;
    });

    expect(abortController.signal.aborted).toBe(false);
    tick(12_000);
    flushMicrotasks();

    expect(abortController.signal.aborted).toBe(true);
    expect(failure).toEqual(new Error('WebRTC negotiation timed out'));
    discardPeriodicTasks();
  }));

  it('falls back to HLS when WHEP connects without rendering a first frame', fakeAsync(() => {
    spectator = createComponent();
    const peerConnection = {
      close: jest.fn(),
      onconnectionstatechange: null,
      ontrack: null,
    } as unknown as RTCPeerConnection;
    const componentState = spectator.component as unknown as {
      hlsLiveError: () => string | null;
      hlsLiveSession: { set: (value: HarborAssistantCameraLiveSessionResponse) => void };
      liveControlPlaybackMode: { set: (value: 'hls-fallback') => void } & (() => string);
      scheduleWebRtcFirstFrameDeadline: (connection: RTCPeerConnection, token: number) => void;
      startHlsPlaybackFromSession: jest.Mock;
      webrtcAttachToken: number;
      webrtcDegradedSessionId: string | null;
      webrtcPeerConnection: RTCPeerConnection | null;
      webrtcPlaybackPending: boolean;
    };
    componentState.hlsLiveSession.set(liveSession());
    componentState.liveControlPlaybackMode.set('hls-fallback');
    componentState.startHlsPlaybackFromSession = jest.fn(() => true);
    componentState.webrtcAttachToken = 1;
    componentState.webrtcPeerConnection = peerConnection;
    componentState.webrtcPlaybackPending = true;

    componentState.scheduleWebRtcFirstFrameDeadline(peerConnection, 1);
    tick(10_000);

    expect(componentState.liveControlPlaybackMode()).toBe('hls-fallback');
    expect(componentState.hlsLiveError()).toContain('did not render a first frame');
    expect(componentState.webrtcDegradedSessionId).toBe('live-test');
    expect(peerConnection.close).toHaveBeenCalled();
    expect(componentState.startHlsPlaybackFromSession).toHaveBeenCalledTimes(1);
    discardPeriodicTasks();
  }));

  it('accepts only same-origin HarborLink media WHEP resource locations', fakeAsync(() => {
    spectator = createComponent();
    const componentState = spectator.component as unknown as {
      validateWhepResourceUrl: (location: string | null) => string;
    };

    expect(componentState.validateWhepResourceUrl(
      '/api/harbor-link/media/harbor-live-test/whep/session-1',
    )).toBe('http://localhost/api/harbor-link/media/harbor-live-test/whep/session-1');
    expect(() => componentState.validateWhepResourceUrl(
      'https://example.com/api/harbor-link/media/harbor-live-test/whep/session-1',
    )).toThrow('outside the allowed HarborLink media path');
    expect(() => componentState.validateWhepResourceUrl(
      '/api/harbor-beacon/media/harbor-live-test/whep/session-1',
    )).toThrow('outside the allowed HarborLink media path');
    expect(() => componentState.validateWhepResourceUrl(
      '/api/harbor-link/media/harbor-live-test/not-whep/session-1',
    )).toThrow('outside the allowed HarborLink media path');
    expect(() => componentState.validateWhepResourceUrl(
      '/api/harbor-link/media/harbor-live-test/whep/session-1?redirect=1',
    )).toThrow('outside the allowed HarborLink media path');
    expect(() => componentState.validateWhepResourceUrl(null)).toThrow('Location header');
    discardPeriodicTasks();
  }));

  it('freezes the current WebRTC frame before attaching HLS time-shift playback', fakeAsync(() => {
    spectator = createComponent();
    const video = fakeLiveVideo({
      readyState: HTMLMediaElement.HAVE_CURRENT_DATA,
      srcObject: {} as MediaStream,
      videoHeight: 720,
      videoWidth: 1280,
    });
    const transitionCanvas = fakeTransitionCanvas();
    const componentState = spectator.component as unknown as {
      hlsLiveSession: { set: (value: HarborAssistantCameraLiveSessionResponse) => void };
      liveControlPlaybackMode: { set: (value: 'webrtc' | 'hls-timeshift') => void } & (() => string);
      liveTransitionFrame?: { nativeElement: HTMLCanvasElement };
      liveTransitionFrameVisible: () => boolean;
      liveVideo?: { nativeElement: HTMLVideoElement };
      startHlsPlaybackFromSession: jest.Mock;
      switchToHlsTimeshift: (timelineSeconds: number, autoplay: boolean) => void;
    };
    componentState.hlsLiveSession.set(liveSession());
    componentState.liveControlPlaybackMode.set('webrtc');
    componentState.liveTransitionFrame = { nativeElement: transitionCanvas.canvas };
    componentState.liveVideo = { nativeElement: video };
    componentState.startHlsPlaybackFromSession = jest.fn(() => true);

    componentState.switchToHlsTimeshift(10, true);

    expect(transitionCanvas.drawImage).toHaveBeenCalledWith(video, 0, 0, 1280, 720);
    expect(componentState.liveTransitionFrameVisible()).toBe(true);
    expect(componentState.liveControlPlaybackMode()).toBe('hls-timeshift');
    expect(componentState.startHlsPlaybackFromSession).toHaveBeenCalledTimes(1);
    discardPeriodicTasks();
  }));

  it('freezes the current HLS frame before starting WebRTC playback', fakeAsync(() => {
    const originalPeerConnection = globalThis.RTCPeerConnection;
    Object.defineProperty(globalThis, 'RTCPeerConnection', {
      configurable: true,
      value: jest.fn(),
      writable: true,
    });
    spectator = createComponent();
    const video = fakeLiveVideo({
      readyState: HTMLMediaElement.HAVE_CURRENT_DATA,
      videoHeight: 720,
      videoWidth: 1280,
    });
    const transitionCanvas = fakeTransitionCanvas();
    const componentState = spectator.component as unknown as {
      harborLinkCapabilities: { set: (value: HarborAssistantHarborLinkCapabilitiesResponse) => void };
      liveControlPlaybackMode: { set: (value: 'hls-timeshift') => void };
      liveTransitionFrame?: { nativeElement: HTMLCanvasElement };
      liveTransitionFrameVisible: () => boolean;
      liveVideo?: { nativeElement: HTMLVideoElement };
      scheduleWebRtcPlaybackAttach: jest.Mock;
      startWebRtcPlaybackFromSession: (session: HarborAssistantCameraLiveSessionResponse) => boolean;
    };
    componentState.harborLinkCapabilities.set(harborLinkCapabilities());
    componentState.liveControlPlaybackMode.set('hls-timeshift');
    componentState.liveTransitionFrame = { nativeElement: transitionCanvas.canvas };
    componentState.liveVideo = { nativeElement: video };
    componentState.scheduleWebRtcPlaybackAttach = jest.fn();

    try {
      expect(componentState.startWebRtcPlaybackFromSession(liveSession({
        webrtc_status: 'ready',
        webrtc_url: '/api/harbor-link/media/harbor-live-test/whep',
      }))).toBe(true);

      expect(transitionCanvas.drawImage).toHaveBeenCalledWith(video, 0, 0, 1280, 720);
      expect(componentState.liveTransitionFrameVisible()).toBe(true);
      expect(componentState.scheduleWebRtcPlaybackAttach).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(globalThis, 'RTCPeerConnection', {
        configurable: true,
        value: originalPeerConnection,
        writable: true,
      });
    }
    discardPeriodicTasks();
  }));

  it('does not start WHEP when HarborLink marks WebRTC as degraded', fakeAsync(() => {
    const originalPeerConnection = globalThis.RTCPeerConnection;
    Object.defineProperty(globalThis, 'RTCPeerConnection', {
      configurable: true,
      value: jest.fn(),
      writable: true,
    });
    spectator = createComponent();
    const componentState = spectator.component as unknown as {
      harborLinkCapabilities: { set: (value: HarborAssistantHarborLinkCapabilitiesResponse) => void };
      scheduleWebRtcPlaybackAttach: jest.Mock;
      startWebRtcPlaybackFromSession: (session: HarborAssistantCameraLiveSessionResponse) => boolean;
    };
    componentState.harborLinkCapabilities.set(harborLinkCapabilities('degraded'));
    componentState.scheduleWebRtcPlaybackAttach = jest.fn();

    try {
      expect(componentState.startWebRtcPlaybackFromSession(liveSession({
        webrtc_status: 'ready',
        webrtc_url: '/api/harbor-link/media/harbor-live-test/whep',
      }))).toBe(false);
      expect(componentState.scheduleWebRtcPlaybackAttach).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(globalThis, 'RTCPeerConnection', {
        configurable: true,
        value: originalPeerConnection,
        writable: true,
      });
    }
    discardPeriodicTasks();
  }));

  it('deletes a remote WHEP resource when attach is cancelled after POST', async () => {
    const originalPeerConnection = globalThis.RTCPeerConnection;
    const originalFetch = globalThis.fetch;
    const peerConnection = {
      addEventListener: jest.fn(),
      addTransceiver: jest.fn(),
      close: jest.fn(),
      connectionState: 'connected',
      createOffer: jest.fn(() => Promise.resolve({ type: 'offer', sdp: 'offer-sdp' })),
      iceGatheringState: 'complete',
      localDescription: null as RTCSessionDescriptionInit | null,
      onconnectionstatechange: null as (() => void) | null,
      ontrack: null as ((event: RTCTrackEvent) => void) | null,
      removeEventListener: jest.fn(),
      setLocalDescription: jest.fn((description: RTCSessionDescriptionInit) => {
        peerConnection.localDescription = description;
        return Promise.resolve();
      }),
      setRemoteDescription: jest.fn(() => Promise.resolve()),
    };
    let componentState: {
      attachWhepPlayback: (video: HTMLVideoElement, url: string, token: number) => Promise<void>;
      liveVideo?: { nativeElement: HTMLVideoElement };
      webrtcAttachToken: number;
    };
    const fetchMock = jest.fn((url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE') {
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve({
        headers: {
          get: (name: string) => {
            return name === 'Location' ? '/api/harbor-link/media/harbor-live-test/whep/session-1' : null;
          },
        },
        ok: true,
        status: 201,
        text: () => {
          componentState.webrtcAttachToken += 1;
          return Promise.resolve('answer-sdp');
        },
      });
    });
    Object.defineProperty(globalThis, 'RTCPeerConnection', {
      configurable: true,
      value: jest.fn(() => peerConnection),
      writable: true,
    });
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
      writable: true,
    });
    spectator = createComponent();
    componentState = spectator.component as unknown as typeof componentState;
    const video = fakeLiveVideo();
    componentState.liveVideo = { nativeElement: video };
    componentState.webrtcAttachToken = 1;

    try {
      await expect(componentState.attachWhepPlayback(
        video,
        '/api/harbor-link/media/harbor-live-test/whep',
        1,
      )).rejects.toThrow('cancelled');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost/api/harbor-link/media/harbor-live-test/whep/session-1',
        expect.objectContaining({ method: 'DELETE' }),
      );
      expect(peerConnection.close).toHaveBeenCalled();
      expect(peerConnection.setRemoteDescription).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(globalThis, 'RTCPeerConnection', {
        configurable: true,
        value: originalPeerConnection,
        writable: true,
      });
      Object.defineProperty(globalThis, 'fetch', {
        configurable: true,
        value: originalFetch,
        writable: true,
      });
    }
  });

  it('replaces the Link live session when WHEP is cancelled before Location arrives', fakeAsync(() => {
    spectator = createComponent();
    const oldSession = liveSession({ session_id: 'live-whep-pending' });
    const fallbackSession = liveSession({
      session_id: 'live-hls-fallback',
      webrtc_status: 'ready',
      webrtc_url: '/api/harbor-link/media/live-hls-fallback/whep',
    });
    api.startCameraLiveSession = jest.fn(() => of(fallbackSession));
    const componentState = spectator.component as unknown as {
      fallbackToHlsPlayback: (message: string) => void;
      hlsLiveSession: {
        set: (value: HarborAssistantCameraLiveSessionResponse) => void;
      } & (() => HarborAssistantCameraLiveSessionResponse | null);
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      startHlsPlaybackFromSession: jest.Mock;
      webrtcPostDispatched: boolean;
      webrtcResourceUrl: string | null;
    };
    componentState.hlsLiveSession.set(oldSession);
    componentState.hlsLiveStatus.set('starting');
    componentState.startHlsPlaybackFromSession = jest.fn(() => true);
    componentState.webrtcPostDispatched = true;
    componentState.webrtcResourceUrl = null;

    componentState.fallbackToHlsPlayback('WebRTC connection timed out.');

    expect(api.stopCameraLiveSession).toHaveBeenCalledWith('cam-1', 'live-whep-pending');
    expect(api.startCameraLiveSession).toHaveBeenCalledWith('cam-1', 'sub');
    expect(componentState.hlsLiveSession()?.session_id).toBe('live-hls-fallback');
    expect(componentState.startHlsPlaybackFromSession).toHaveBeenCalledWith(
      fallbackSession,
      { pending: false },
    );
    discardPeriodicTasks();
  }));

  it('requests Link live-session cleanup when the component unmounts during WHEP negotiation', fakeAsync(() => {
    spectator = createComponent();
    const session = liveSession({ session_id: 'live-unmount-pending' });
    const componentState = spectator.component as unknown as {
      hlsLiveSession: { set: (value: HarborAssistantCameraLiveSessionResponse) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      webrtcPostDispatched: boolean;
    };
    componentState.hlsLiveSession.set(session);
    componentState.hlsLiveStatus.set('starting');
    componentState.webrtcPostDispatched = true;

    spectator.component.ngOnDestroy();

    expect(api.stopCameraLiveSession).toHaveBeenCalledWith('cam-1', 'live-unmount-pending');
    discardPeriodicTasks();
  }));

  it('keeps the frozen frame until the target transport presents its first frame', fakeAsync(() => {
    spectator = createComponent();
    let presentedFrame: (() => void) | null = null;
    const cancelVideoFrameCallback = jest.fn();
    const requestVideoFrameCallback = jest.fn((callback: () => void) => {
      presentedFrame = callback;
      return 41;
    });
    const video = fakeLiveVideo({
      cancelVideoFrameCallback,
      readyState: HTMLMediaElement.HAVE_CURRENT_DATA,
      requestVideoFrameCallback,
      videoHeight: 720,
      videoWidth: 1280,
    });
    const transitionCanvas = fakeTransitionCanvas();
    const componentState = spectator.component as unknown as {
      beginLiveTransportTransition: (target: 'hls') => void;
      liveControlPlaybackMode: { set: (value: 'webrtc' | 'hls-timeshift') => void };
      liveTransitionFrame?: { nativeElement: HTMLCanvasElement };
      liveTransitionFrameVisible: () => boolean;
      liveVideo?: { nativeElement: HTMLVideoElement };
    };
    componentState.liveControlPlaybackMode.set('webrtc');
    componentState.liveTransitionFrame = { nativeElement: transitionCanvas.canvas };
    componentState.liveVideo = { nativeElement: video };
    componentState.beginLiveTransportTransition('hls');
    componentState.liveControlPlaybackMode.set('hls-timeshift');

    spectator.component.onLiveVideoLoadedData();

    expect(componentState.liveTransitionFrameVisible()).toBe(true);
    expect(requestVideoFrameCallback).toHaveBeenCalledTimes(1);
    presentedFrame?.();
    expect(componentState.liveTransitionFrameVisible()).toBe(false);
    expect(cancelVideoFrameCallback).toHaveBeenCalledWith(41);
    discardPeriodicTasks();
  }));

  it('updates the custom control immediately when WebRTC playback is paused', fakeAsync(() => {
    spectator = createComponent();
    let currentTimeMs = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => currentTimeMs);
    let paused = false;
    const pause = jest.fn(() => {
      paused = true;
    });
    const video = fakeLiveVideo({ pause });
    Object.defineProperty(video, 'paused', {
      configurable: true,
      get: () => paused,
    });
    const componentState = spectator.component as unknown as {
      hlsLiveSession: { set: (value: HarborAssistantCameraLiveSessionResponse) => void };
      liveControlCurrentTime: () => number;
      liveControlPaused: { set: (value: boolean) => void } & (() => boolean);
      liveControlPlaybackMode: { set: (value: 'webrtc') => void } & (() => string);
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoPlaying: () => void;
      startHlsPlaybackFromSession: jest.Mock;
      toggleLivePlaybackFromControls: () => void;
    };
    componentState.hlsLiveSession.set(liveSession());
    componentState.liveControlPlaybackMode.set('webrtc');
    componentState.liveControlPaused.set(false);
    componentState.liveVideo = { nativeElement: video };
    componentState.startHlsPlaybackFromSession = jest.fn(() => true);
    componentState.onLiveVideoPlaying();
    currentTimeMs += 1_000;

    componentState.toggleLivePlaybackFromControls();

    expect(pause).toHaveBeenCalledTimes(1);
    expect(componentState.liveControlPaused()).toBe(true);
    expect(componentState.liveControlCurrentTime()).toBeGreaterThan(0);

    paused = false;
    componentState.toggleLivePlaybackFromControls();

    expect(componentState.liveControlPlaybackMode()).toBe('hls-timeshift');
    expect(componentState.startHlsPlaybackFromSession).toHaveBeenCalledTimes(1);
    discardPeriodicTasks();
  }));

  it('keeps the WebRTC timeline at zero until the first playable frame', fakeAsync(() => {
    spectator = createComponent();
    let currentTimeMs = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => currentTimeMs);
    const video = fakeLiveVideo({ paused: false });
    const componentState = spectator.component as unknown as {
      hlsLiveSession: { set: (value: HarborAssistantCameraLiveSessionResponse) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveControlCurrentTime: () => number;
      liveControlEndTime: () => number;
      liveControlPlaybackMode: { set: (value: 'webrtc') => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      syncLiveControlState: () => void;
    };
    componentState.hlsLiveSession.set(liveSession({ started_at: '1970-01-01T00:13:20.000Z' }));
    componentState.hlsLiveStatus.set('live');
    componentState.liveControlPlaybackMode.set('webrtc');
    componentState.liveVideo = { nativeElement: video };

    componentState.syncLiveControlState();
    expect(componentState.liveControlCurrentTime()).toBeCloseTo(0);
    expect(componentState.liveControlEndTime()).toBeCloseTo(0);

    currentTimeMs += 1_000;
    componentState.syncLiveControlState();

    expect(componentState.liveControlCurrentTime()).toBeCloseTo(0);
    expect(componentState.liveControlEndTime()).toBeCloseTo(0);
    discardPeriodicTasks();
  }));

  it('starts the visible WebRTC timeline at zero after reusing a prewarmed session', fakeAsync(() => {
    spectator = createComponent();
    let currentTimeMs = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => currentTimeMs);
    const video = fakeLiveVideo({ paused: false });
    const componentState = spectator.component as unknown as {
      hlsLiveSession: { set: (value: HarborAssistantCameraLiveSessionResponse) => void };
      hlsLiveStatus: { set: (value: 'live') => void };
      liveControlCurrentTime: () => number;
      liveControlEndTime: () => number;
      liveControlPlaybackMode: { set: (value: 'webrtc') => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoPlaying: () => void;
      syncLiveControlState: () => void;
    };
    componentState.hlsLiveSession.set(liveSession({ started_at: '1970-01-01T00:13:20.000Z' }));
    componentState.hlsLiveStatus.set('live');
    componentState.liveControlPlaybackMode.set('webrtc');
    componentState.liveVideo = { nativeElement: video };

    componentState.onLiveVideoPlaying();

    expect(componentState.liveControlCurrentTime()).toBeCloseTo(0);
    expect(componentState.liveControlEndTime()).toBeCloseTo(0);

    currentTimeMs += 1_000;
    componentState.syncLiveControlState();

    expect(componentState.liveControlCurrentTime()).toBeCloseTo(1);
    expect(componentState.liveControlEndTime()).toBeCloseTo(1);
    discardPeriodicTasks();
  }));

  it('maps an RFC3339 WebRTC seek request to the matching HLS delay', fakeAsync(() => {
    spectator = createComponent();
    let currentTimeMs = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => currentTimeMs);
    const video = fakeLiveVideo({ paused: false });
    const componentState = spectator.component as unknown as {
      hlsLiveSession: { set: (value: HarborAssistantCameraLiveSessionResponse) => void };
      liveControlPlaybackMode: { set: (value: 'webrtc') => void } & (() => string);
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoPlaying: () => void;
      pendingHlsBehindLiveSeconds: number | null;
      seekLivePlaybackFromControls: (seconds: number) => void;
      startHlsPlaybackFromSession: jest.Mock;
      syncLiveControlState: () => void;
    };
    componentState.hlsLiveSession.set(liveSession({ started_at: '1970-01-01T00:13:20.000Z' }));
    componentState.liveControlPlaybackMode.set('webrtc');
    componentState.liveVideo = { nativeElement: video };
    componentState.startHlsPlaybackFromSession = jest.fn(() => true);
    componentState.onLiveVideoPlaying();
    currentTimeMs += 200_000;
    componentState.syncLiveControlState();

    componentState.seekLivePlaybackFromControls(150);

    expect(componentState.liveControlPlaybackMode()).toBe('hls-timeshift');
    expect(componentState.pendingHlsBehindLiveSeconds).toBeCloseTo(50);
    expect(componentState.startHlsPlaybackFromSession).toHaveBeenCalledTimes(1);
    discardPeriodicTasks();
  }));

  it('resets the visible timeline when a new live playback starts', fakeAsync(() => {
    spectator = createComponent();
    let currentTimeMs = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => currentTimeMs);
    const video = fakeLiveVideo({ paused: false });
    const componentState = spectator.component as unknown as {
      hlsLiveSession: { set: (value: HarborAssistantCameraLiveSessionResponse) => void };
      hlsLiveStatus: { set: (value: 'live') => void };
      liveControlEndTime: () => number;
      liveControlPlaybackMode: { set: (value: 'webrtc') => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoPlaying: () => void;
      syncLiveControlState: () => void;
    };
    componentState.hlsLiveSession.set(liveSession());
    componentState.hlsLiveStatus.set('live');
    componentState.liveControlPlaybackMode.set('webrtc');
    componentState.liveVideo = { nativeElement: video };
    componentState.onLiveVideoPlaying();
    currentTimeMs += 5_000;
    componentState.syncLiveControlState();
    expect(componentState.liveControlEndTime()).toBeCloseTo(5);

    spectator.component.stopLive(false);
    componentState.hlsLiveSession.set(liveSession({ session_id: 'live-test-2' }));
    componentState.hlsLiveStatus.set('live');
    componentState.liveControlPlaybackMode.set('webrtc');
    componentState.onLiveVideoPlaying();

    expect(componentState.liveControlEndTime()).toBeCloseTo(0);
    discardPeriodicTasks();
  }));

  it('prewarms the selected HLS live session without changing playback state', fakeAsync(() => {
    spectator = createComponent();

    tick(299);
    expect(api.startCameraLiveSession).not.toHaveBeenCalled();

    tick(1);

    expect(api.startCameraLiveSession).toHaveBeenCalledWith('cam-1', 'sub');
    expect(spectator.component.liveModeLabel()).toBe('Stopped');
    discardPeriodicTasks();
  }));

  it('starts HLS prewarm before the DVR status request completes', fakeAsync(() => {
    const pendingDvrStatus$ = new Subject<HarborAssistantSearchDvrStatusResponse>();
    api.dvrStatus = jest.fn(() => pendingDvrStatus$.asObservable());
    spectator = createComponent();

    tick(300);

    expect(api.startCameraLiveSession).toHaveBeenCalledWith('cam-1', 'sub');

    pendingDvrStatus$.next(dvrStatus());
    pendingDvrStatus$.complete();
    discardPeriodicTasks();
  }));

  it('reuses an in-flight HLS prewarm request when live playback starts', fakeAsync(() => {
    const pendingStart$ = new Subject<HarborAssistantCameraLiveSessionResponse>();
    api.startCameraLiveSession = jest.fn(() => pendingStart$.asObservable());
    spectator = createComponent();

    tick(300);
    spectator.component.startLive();

    expect(api.startCameraLiveSession).toHaveBeenCalledTimes(1);
    expect(api.startCameraLiveSession).toHaveBeenCalledWith('cam-1', 'sub');

    pendingStart$.next(liveSession());
    pendingStart$.complete();
    tick();

    expect(api.stopCameraLiveSession).not.toHaveBeenCalled();
    expect(spectator.component.liveModeLabel()).toBe('Starting sub stream');
    discardPeriodicTasks();
  }));

  it('starts the selected main HLS stream profile', fakeAsync(() => {
    spectator = createComponent();
    api.startCameraLiveSession = jest.fn(() => of(liveSession({ stream_profile: 'main' })));
    api.cameraLiveStatus = jest.fn(() => of(liveSession({ stream_profile: 'main' })));
    const componentState = spectator.component as unknown as {
      selectStreamProfile: (profile: 'sub' | 'main') => void;
    };

    componentState.selectStreamProfile('main');
    spectator.component.startLive();

    expect(api.startCameraLiveSession).toHaveBeenCalledWith('cam-1', 'main');
    expect(spectator.component.liveModeLabel()).toBe('Starting main stream');
    discardPeriodicTasks();
  }));

  it('keeps waiting when HLS media segments arrive after the camera keyframe delay', fakeAsync(() => {
    const pendingSession = liveSession({
      playlist_ready: false,
      diagnostics: {
        playlist_exists: true,
        segment_count: 0,
        latest_segment_name: null,
        latest_segment_size_bytes: null,
        latest_segment_modified_at: null,
        ffmpeg_running: true,
      },
    });
    let pollCount = 0;
    api.startCameraLiveSession = jest.fn(() => of(pendingSession));
    api.cameraLiveStatus = jest.fn(() => {
      pollCount += 1;
      return of(pollCount < 43 ? pendingSession : liveSession());
    });
    spectator = createComponent();
    const componentState = spectator.component as unknown as {
      hlsLiveError: () => string | null;
      hlsLiveStatus: () => HlsLiveStatus;
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoLoadedData: () => void;
    };
    componentState.liveVideo = { nativeElement: fakeLiveVideo() };

    spectator.component.startLive();
    tick(20_000);

    expect(componentState.hlsLiveStatus()).toBe('starting');
    expect(componentState.hlsLiveError()).toBeNull();

    tick(1100);

    expect(componentState.hlsLiveStatus()).toBe('starting');
    componentState.onLiveVideoLoadedData();

    expect(componentState.hlsLiveStatus()).toBe('live');
    discardPeriodicTasks();
  }));

  it('attaches HLS playback while a playlist with pending segments is still starting', fakeAsync(() => {
    const pendingStatus$ = new Subject<HarborAssistantCameraLiveSessionResponse>();
    const playlistUrl = '/api/beacon/cameras/cam-1/live/live-test/index.m3u8';
    api.startCameraLiveSession = jest.fn(() => of(liveSession({
      playlist_url: playlistUrl,
      playlist_ready: false,
      diagnostics: {
        playlist_exists: true,
        segment_count: 1,
        latest_segment_name: 'segment_00001.m4s',
        latest_segment_size_bytes: null,
        latest_segment_modified_at: null,
        ffmpeg_running: true,
      },
    })));
    api.cameraLiveStatus = jest.fn(() => pendingStatus$.asObservable());
    spectator = createComponent();
    const loadSource = jest.spyOn(Hls.prototype, 'loadSource').mockImplementation(jest.fn());
    const attachMedia = jest.spyOn(Hls.prototype, 'attachMedia').mockImplementation(jest.fn());
    jest.spyOn(Hls, 'isSupported').mockReturnValue(true);
    jest.spyOn(Hls.prototype, 'on').mockImplementation(jest.fn());
    jest.spyOn(Hls.prototype, 'destroy').mockImplementation(jest.fn());
    const video = fakeLiveVideo();
    const componentState = spectator.component as unknown as {
      hlsLiveStatus: () => HlsLiveStatus;
      liveVideo?: { nativeElement: HTMLVideoElement };
    };
    componentState.liveVideo = { nativeElement: video };

    spectator.component.startLive();
    tick();

    expect(loadSource).toHaveBeenCalledWith(playlistUrl);
    expect(attachMedia).toHaveBeenCalledWith(video);
    expect(componentState.hlsLiveStatus()).toBe('starting');
    discardPeriodicTasks();
  }));

  it('keeps HLS live visible and reports paused browser playback', fakeAsync(() => {
    spectator = createComponent();
    const play = jest.fn(() => Promise.reject(new Error('autoplay paused')));
    const componentState = spectator.component as unknown as {
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: {
        set: (value: HlsLiveStatus) => void;
      } & (() => string);
      hlsLiveError: () => string | null;
      liveVideo?: { nativeElement: HTMLVideoElement };
    };
    componentState.hlsLiveUrl.set('/api/beacon/cameras/cam-1/live/live-test/index.m3u8');
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = {
      nativeElement: {
        currentTime: 0,
        load: jest.fn(),
        muted: false,
        pause: jest.fn(),
        paused: true,
        play,
        playsInline: false,
        removeAttribute: jest.fn(),
      } as unknown as HTMLVideoElement,
    };

    spectator.component.resumeLivePlayback();
    tick();
    flushMicrotasks();
    for (let attempt = 0; attempt < 6; attempt += 1) {
      tick(350);
      flushMicrotasks();
    }

    expect(play).toHaveBeenCalledTimes(7);
    expect(componentState.hlsLiveStatus()).toBe('live');
    expect(componentState.hlsLiveError()).toBe(
      'Browser paused live playback. Press the video play control.',
    );
    discardPeriodicTasks();
  }));

  it('retries autoplay when the video pauses before the first playing event', fakeAsync(() => {
    spectator = createComponent();
    const play = jest.fn(() => Promise.resolve());
    const video = fakeLiveVideo({ play });
    const componentState = spectator.component as unknown as {
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoPause: () => void;
    };
    componentState.hlsLiveUrl.set('/api/beacon/cameras/cam-1/live/live-test/index.m3u8');
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: video };

    componentState.onLiveVideoPause();
    tick();
    flushMicrotasks();

    expect(play).toHaveBeenCalledTimes(1);
    discardPeriodicTasks();
  }));

  it('coalesces overlapping autoplay triggers without pausing a successful play', fakeAsync(() => {
    spectator = createComponent();
    let resolvePlay = (): void => undefined;
    const play = jest.fn(() => new Promise<void>((resolve) => {
      resolvePlay = resolve;
    }));
    const pause = jest.fn();
    const video = fakeLiveVideo({ pause, paused: true, play });
    const componentState = spectator.component as unknown as {
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoLoadedData: () => void;
      resumeLivePlayback: () => void;
    };
    componentState.hlsLiveUrl.set('/api/beacon/cameras/cam-1/live/live-test/index.m3u8');
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: video };

    componentState.resumeLivePlayback();
    componentState.onLiveVideoLoadedData();
    componentState.resumeLivePlayback();
    tick();

    expect(play).toHaveBeenCalledTimes(1);

    (video as { paused: boolean }).paused = false;
    resolvePlay();
    flushMicrotasks();

    expect(pause).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('keeps background playback at its current position without catching up to live', fakeAsync(() => {
    const visibilityState = jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    spectator = createComponent();
    const play = jest.fn(() => Promise.resolve());
    const bufferedRange = fakeTimeRanges([[0, 80]]);
    const video = fakeLiveVideo({
      currentTime: 12,
      paused: false,
      play,
      buffered: bufferedRange,
      seekable: bufferedRange,
    });
    const componentState = spectator.component as unknown as {
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoPause: () => void;
      onLiveVideoPlaying: () => void;
      seekLiveVideoToEdge: (force?: boolean) => void;
    };
    componentState.hlsLiveUrl.set('/api/beacon/cameras/cam-1/live/live-test/index.m3u8');
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: video };
    componentState.onLiveVideoPlaying();

    visibilityState.mockReturnValue('hidden');
    (video as { paused: boolean }).paused = true;
    componentState.onLiveVideoPause();
    componentState.seekLiveVideoToEdge(true);
    tick();
    flushMicrotasks();

    expect(play).toHaveBeenCalledTimes(1);
    expect(video.currentTime).toBe(12);

    visibilityState.mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    tick();
    flushMicrotasks();

    expect(play).toHaveBeenCalledTimes(2);
    expect(video.currentTime).toBe(12);
    discardPeriodicTasks();
  }));

  it('does not override an explicit user pause after visibility changes', fakeAsync(() => {
    const visibilityState = jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    spectator = createComponent();
    const play = jest.fn(() => Promise.resolve());
    const video = fakeLiveVideo({ currentTime: 12, paused: true, play });
    const componentState = spectator.component as unknown as {
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoPause: () => void;
      onLiveVideoPlaying: () => void;
    };
    componentState.hlsLiveUrl.set('/api/beacon/cameras/cam-1/live/live-test/index.m3u8');
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: video };
    componentState.onLiveVideoPlaying();
    componentState.onLiveVideoPause();

    visibilityState.mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    visibilityState.mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    tick();
    flushMicrotasks();

    expect(play).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('resumes a tab-induced live pause without moving the playback position', fakeAsync(() => {
    spectator = createComponent();
    const play = jest.fn(() => Promise.resolve());
    const pausePlayback = jest.fn();
    const video = fakeLiveVideo({ currentTime: 12, paused: true, play });
    const componentState = spectator.component as unknown as {
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      playbackVideo?: { nativeElement: HTMLVideoElement };
      onCameraTabChange: (index: number) => void;
      onLiveVideoPause: () => void;
      onLiveVideoPlaying: () => void;
      selectedTabIndex: () => number;
    };
    componentState.hlsLiveUrl.set('/api/beacon/cameras/cam-1/live/live-test/index.m3u8');
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: video };
    componentState.playbackVideo = {
      nativeElement: fakeLiveVideo({ pause: pausePlayback, paused: false }),
    };
    componentState.onLiveVideoPlaying();

    componentState.onCameraTabChange(1);
    componentState.onLiveVideoPause();
    tick();
    flushMicrotasks();

    expect(play).toHaveBeenCalledTimes(1);
    expect(video.currentTime).toBe(12);
    expect(componentState.selectedTabIndex()).toBe(1);

    componentState.onCameraTabChange(0);
    tick();
    flushMicrotasks();

    expect(play).toHaveBeenCalledTimes(2);
    expect(pausePlayback).toHaveBeenCalledTimes(1);
    expect(video.currentTime).toBe(12);
    expect(componentState.selectedTabIndex()).toBe(0);
    discardPeriodicTasks();
  }));

  it('does not resume an explicit live pause after switching tabs', fakeAsync(() => {
    spectator = createComponent();
    const play = jest.fn(() => Promise.resolve());
    const video = fakeLiveVideo({ currentTime: 12, paused: true, play });
    const componentState = spectator.component as unknown as {
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      onCameraTabChange: (index: number) => void;
      onLiveVideoPause: () => void;
      onLiveVideoPlaying: () => void;
    };
    componentState.hlsLiveUrl.set('/api/beacon/cameras/cam-1/live/live-test/index.m3u8');
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: video };
    componentState.onLiveVideoPlaying();
    componentState.onLiveVideoPause();

    componentState.onCameraTabChange(1);
    componentState.onCameraTabChange(0);
    tick();
    flushMicrotasks();

    expect(play).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('does not resume HLS playback after the user pauses live video', fakeAsync(() => {
    spectator = createComponent();
    const play = jest.fn(() => Promise.resolve());
    const video = fakeLiveVideo({
      currentTime: 12,
      paused: true,
      play,
    });
    const componentState = spectator.component as unknown as {
      hlsLiveError: () => string | null;
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoPause: () => void;
      resumeLivePlayback: () => void;
    };
    componentState.hlsLiveUrl.set('/api/beacon/cameras/cam-1/live/live-test/index.m3u8');
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: video };

    spectator.component.onLiveVideoPlaying();
    componentState.onLiveVideoPause();
    componentState.resumeLivePlayback();
    tick();
    tick(2100);
    flushMicrotasks();

    expect(play).not.toHaveBeenCalled();
    expect(componentState.hlsLiveError()).toBeNull();
    discardPeriodicTasks();
  }));

  it('resumes native playback from the paused HLS position', fakeAsync(() => {
    spectator = createComponent();
    const play = jest.fn(() => Promise.resolve());
    const bufferedRange = fakeTimeRanges([[0, 80]]);
    const video = fakeLiveVideo({
      currentTime: 12,
      paused: true,
      playbackRate: 1.25,
      play,
      buffered: bufferedRange,
      seekable: bufferedRange,
    });
    const componentState = spectator.component as unknown as {
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoPause: () => void;
      onLiveVideoPlay: () => void;
      resumeLivePlayback: () => void;
    };
    componentState.hlsLiveUrl.set('/api/beacon/cameras/cam-1/live/live-test/index.m3u8');
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: video };

    spectator.component.onLiveVideoPlaying();
    componentState.onLiveVideoPause();
    video.currentTime = 74;
    componentState.onLiveVideoPlay();
    componentState.resumeLivePlayback();
    tick();
    flushMicrotasks();

    expect(play).not.toHaveBeenCalled();
    expect(video.currentTime).toBe(12);
    expect(video.playbackRate).toBe(1);
    discardPeriodicTasks();
  }));

  it('keeps a stale programmatic play event from clearing user pause', fakeAsync(() => {
    spectator = createComponent();
    const play = jest.fn(() => new Promise<void>((resolve) => {
      globalThis.setTimeout(resolve, 1);
    }));
    const pause = jest.fn();
    const video = fakeLiveVideo({
      currentTime: 12,
      pause,
      paused: true,
      play,
    });
    const componentState = spectator.component as unknown as {
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoPause: () => void;
      onLiveVideoPlay: () => void;
      resumeLivePlayback: () => void;
    };
    componentState.hlsLiveUrl.set('/api/beacon/cameras/cam-1/live/live-test/index.m3u8');
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: video };

    componentState.resumeLivePlayback();
    tick();
    spectator.component.onLiveVideoPlaying();
    componentState.onLiveVideoPause();
    componentState.onLiveVideoPlay();
    componentState.resumeLivePlayback();
    tick(1);
    flushMicrotasks();

    expect(pause).toHaveBeenCalled();
    expect(play).toHaveBeenCalledTimes(1);
    discardPeriodicTasks();
  }));

  it('pauses a stale pending play request after user pause', fakeAsync(() => {
    spectator = createComponent();
    const play = jest.fn(() => new Promise<void>((resolve) => {
      globalThis.setTimeout(resolve, 1);
    }));
    const pause = jest.fn();
    const video = fakeLiveVideo({
      currentTime: 12,
      pause,
      paused: true,
      play,
    });
    const componentState = spectator.component as unknown as {
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoPause: () => void;
      resumeLivePlayback: () => void;
    };
    componentState.hlsLiveUrl.set('/api/beacon/cameras/cam-1/live/live-test/index.m3u8');
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: video };

    componentState.resumeLivePlayback();
    tick();
    spectator.component.onLiveVideoPlaying();
    componentState.onLiveVideoPause();
    tick(1);
    flushMicrotasks();
    componentState.resumeLivePlayback();
    tick(2100);
    flushMicrotasks();

    expect(play).toHaveBeenCalledTimes(1);
    expect(pause).toHaveBeenCalledTimes(1);
    discardPeriodicTasks();
  }));

  it('does not remute user-unmuted HLS live playback during resume', fakeAsync(() => {
    spectator = createComponent();
    const video = fakeLiveVideo({
      currentTime: 4,
      muted: false,
      paused: false,
    });
    const componentState = spectator.component as unknown as {
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
    };
    componentState.hlsLiveUrl.set('/api/beacon/cameras/cam-1/live/live-test/index.m3u8');
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: video };

    spectator.component.resumeLivePlayback();
    tick();

    expect(video.muted).toBe(false);
    discardPeriodicTasks();
  }));

  it('moves stale HLS playback to the low-latency sync position', fakeAsync(() => {
    spectator = createComponent();
    const video = fakeLiveVideo({
      currentTime: 8,
      paused: false,
      playbackRate: 1,
      seekable: {
        end: jest.fn(() => 60),
        length: 1,
        start: jest.fn(() => 0),
      } as unknown as TimeRanges,
    });
    const componentState = spectator.component as unknown as {
      hls: Hls | null;
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      seekLiveVideoToEdge: (force?: boolean) => void;
    };
    componentState.hlsLiveUrl.set('/api/beacon/cameras/cam-1/live/live-test/index.m3u8');
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: video };
    componentState.hls = { liveSyncPosition: 59.4, destroy: jest.fn() } as unknown as Hls;

    componentState.seekLiveVideoToEdge();

    expect(video.currentTime).toBeCloseTo(59.4);
    expect(video.playbackRate).toBe(1);
    discardPeriodicTasks();
  }));

  it('avoids force seeking when HLS playback is close enough to live', fakeAsync(() => {
    spectator = createComponent();
    const video = fakeLiveVideo({
      currentTime: 48,
      paused: false,
      playbackRate: 1,
      seekable: {
        end: jest.fn(() => 60),
        length: 1,
        start: jest.fn(() => 0),
      } as unknown as TimeRanges,
    });
    const componentState = spectator.component as unknown as {
      liveVideo?: { nativeElement: HTMLVideoElement };
      seekLiveVideoToEdge: (force?: boolean) => void;
    };
    componentState.liveVideo = { nativeElement: video };

    componentState.seekLiveVideoToEdge();

    expect(video.currentTime).toBe(48);
    expect(video.playbackRate).toBe(1.05);
    discardPeriodicTasks();
  }));

  it('keeps delayed live playback away from the live edge after the user presses play again', fakeAsync(() => {
    spectator = createComponent();
    const bufferedRange = fakeTimeRanges([[0, 80]]);
    const video = fakeLiveVideo({
      currentTime: 8,
      paused: true,
      playbackRate: 1.25,
      buffered: bufferedRange,
      seekable: bufferedRange,
    });
    const componentState = spectator.component as unknown as {
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoPause: () => void;
      onLiveVideoPlay: () => void;
      seekLiveVideoToEdge: (force?: boolean) => void;
    };
    componentState.hlsLiveUrl.set('/api/beacon/cameras/cam-1/live/live-test/index.m3u8');
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: video };

    spectator.component.onLiveVideoPlaying();
    componentState.onLiveVideoPause();
    video.currentTime = 74;
    componentState.seekLiveVideoToEdge(true);
    expect(video.currentTime).toBe(8);
    expect(video.playbackRate).toBe(1);

    componentState.onLiveVideoPlay();
    componentState.seekLiveVideoToEdge(true);

    expect(video.currentTime).toBe(8);
    expect(video.playbackRate).toBe(1);
    discardPeriodicTasks();
  }));

  it('keeps the HLS control timeline moving forward when a new fragment advances the live edge', fakeAsync(() => {
    spectator = createComponent();
    let currentTimeMs = 1_000_000;
    let liveEdgeSeconds = 100;
    jest.spyOn(Date, 'now').mockImplementation(() => currentTimeMs);
    const seekableRange = {
      end: jest.fn(() => liveEdgeSeconds),
      length: 1,
      start: jest.fn(() => 0),
    } as unknown as TimeRanges;
    const video = fakeLiveVideo({
      currentTime: 100,
      paused: false,
      seekable: seekableRange,
    });
    const componentState = spectator.component as unknown as {
      hlsLiveSession: { set: (value: HarborAssistantCameraLiveSessionResponse) => void };
      liveControlCurrentTime: () => number;
      liveControlEndTime: () => number;
      liveControlPlaybackMode: { set: (value: 'hls-timeshift') => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoPlaying: () => void;
      syncLiveControlState: () => void;
    };
    componentState.hlsLiveSession.set(liveSession({ started_at: '800' }));
    componentState.liveControlPlaybackMode.set('hls-timeshift');
    componentState.liveVideo = { nativeElement: video };
    componentState.onLiveVideoPlaying();

    expect(componentState.liveControlCurrentTime()).toBeCloseTo(0);
    expect(componentState.liveControlEndTime()).toBeCloseTo(0);

    currentTimeMs += 20_000;
    liveEdgeSeconds = 120;
    video.currentTime = 108;
    componentState.syncLiveControlState();

    expect(componentState.liveControlCurrentTime()).toBeCloseTo(8);
    expect(componentState.liveControlEndTime()).toBeCloseTo(20);

    currentTimeMs += 200;
    liveEdgeSeconds = 122;
    video.currentTime = 108.2;
    componentState.syncLiveControlState();

    expect(componentState.liveControlCurrentTime()).toBeCloseTo(8.2);
    expect(componentState.liveControlEndTime()).toBeCloseTo(20.2);
    discardPeriodicTasks();
  }));

  it('uses the stable HLS timeline mapping when seeking after the live edge advances', fakeAsync(() => {
    spectator = createComponent();
    let currentTimeMs = 1_000_000;
    let liveEdgeSeconds = 100;
    jest.spyOn(Date, 'now').mockImplementation(() => currentTimeMs);
    const seekableRange = {
      end: jest.fn(() => liveEdgeSeconds),
      length: 1,
      start: jest.fn(() => 0),
    } as unknown as TimeRanges;
    const video = fakeLiveVideo({
      currentTime: 100,
      paused: false,
      seekable: seekableRange,
    });
    const componentState = spectator.component as unknown as {
      hlsLiveSession: { set: (value: HarborAssistantCameraLiveSessionResponse) => void };
      liveControlEndTime: { set: (value: number) => void };
      liveControlPlaybackMode: { set: (value: 'hls-timeshift') => void };
      liveControlStartTime: { set: (value: number) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoPlaying: () => void;
      seekLivePlaybackFromControls: (seconds: number) => void;
      syncLiveControlState: () => void;
    };
    componentState.hlsLiveSession.set(liveSession({ started_at: '800' }));
    componentState.liveControlPlaybackMode.set('hls-timeshift');
    componentState.liveVideo = { nativeElement: video };
    componentState.onLiveVideoPlaying();

    currentTimeMs += 200_000;
    liveEdgeSeconds = 300;
    video.currentTime = 288;
    componentState.syncLiveControlState();

    currentTimeMs += 200;
    liveEdgeSeconds = 302;
    componentState.liveControlStartTime.set(100);
    componentState.liveControlEndTime.set(200.2);
    componentState.seekLivePlaybackFromControls(150);

    expect(video.currentTime).toBeCloseTo(250);
    discardPeriodicTasks();
  }));

  it('plays from a user-selected HLS history position instead of jumping to live edge', fakeAsync(() => {
    spectator = createComponent();
    const bufferedRange = fakeTimeRanges([[0, 90]]);
    const video = fakeLiveVideo({
      currentTime: 35,
      paused: false,
      playbackRate: 1,
      buffered: bufferedRange,
      seekable: bufferedRange,
    });
    const componentState = spectator.component as unknown as {
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoSeeked: () => void;
      seekLiveVideoToEdge: (force?: boolean) => void;
    };
    componentState.hlsLiveUrl.set('/api/beacon/cameras/cam-1/live/live-test/index.m3u8');
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: video };

    componentState.onLiveVideoSeeked();
    video.currentTime = 42;
    componentState.seekLiveVideoToEdge(true);

    expect(video.currentTime).toBe(42);
    expect(video.playbackRate).toBe(1);
    discardPeriodicTasks();
  }));

  it('keeps the user-selected delayed HLS playback rate while catching up', fakeAsync(() => {
    spectator = createComponent();
    const bufferedRange = fakeTimeRanges([[0, 90]]);
    const video = fakeLiveVideo({
      currentTime: 35,
      paused: false,
      playbackRate: 1,
      buffered: bufferedRange,
      seekable: bufferedRange,
    });
    const componentState = spectator.component as unknown as {
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoRateChange: () => void;
      onLiveVideoSeeked: () => void;
      seekLiveVideoToEdge: (force?: boolean) => void;
    };
    componentState.hlsLiveUrl.set('/api/beacon/cameras/cam-1/live/live-test/index.m3u8');
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: video };

    componentState.onLiveVideoSeeked();
    video.playbackRate = 2;
    componentState.onLiveVideoRateChange();
    video.currentTime = 60;
    componentState.seekLiveVideoToEdge();

    expect(video.currentTime).toBe(60);
    expect(video.playbackRate).toBe(2);
    discardPeriodicTasks();
  }));

  it('keeps a user-selected slow playback rate at the HLS live edge', fakeAsync(() => {
    spectator = createComponent();
    const bufferedRange = fakeTimeRanges([[0, 90]]);
    const video = fakeLiveVideo({
      currentTime: 89.5,
      paused: false,
      playbackRate: 1,
      buffered: bufferedRange,
      seekable: bufferedRange,
    });
    const componentState = spectator.component as unknown as {
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoRateChange: () => void;
      onLiveVideoTimeUpdate: () => void;
      startLiveEdgeMonitor: () => void;
    };
    componentState.hlsLiveUrl.set('/api/beacon/cameras/cam-1/live/live-test/index.m3u8');
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: video };

    video.playbackRate = 0.25;
    componentState.onLiveVideoRateChange();
    componentState.onLiveVideoTimeUpdate();
    componentState.startLiveEdgeMonitor();
    tick(1_000);

    expect(video.playbackRate).toBe(0.25);
    discardPeriodicTasks();
  }));

  it('keeps 2x HLS playback at exactly a one-second visible gap', fakeAsync(() => {
    spectator = createComponent();
    const bufferedRange = fakeTimeRanges([[0, 90]]);
    const video = fakeLiveVideo({
      currentTime: 35,
      paused: false,
      playbackRate: 1,
      buffered: bufferedRange,
      seekable: bufferedRange,
    });
    const session = liveSession({
      webrtc_status: 'ready',
      webrtc_url: '/api/harbor-link/media/live-test/whep',
    });
    const componentState = spectator.component as unknown as {
      hlsLiveSession: { set: (value: HarborAssistantCameraLiveSessionResponse) => void };
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveControlCurrentTime: { set: (value: number) => void };
      liveControlEndTime: { set: (value: number) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoRateChange: () => void;
      onLiveVideoSeeked: () => void;
      seekLiveVideoToEdge: (force?: boolean) => void;
      startWebRtcPlaybackFromSession: jest.Mock;
    };
    componentState.hlsLiveSession.set(session);
    componentState.hlsLiveUrl.set('/api/beacon/cameras/cam-1/live/live-test/index.m3u8');
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: video };
    componentState.startWebRtcPlaybackFromSession = jest.fn(() => true);

    componentState.onLiveVideoSeeked();
    video.playbackRate = 2;
    componentState.onLiveVideoRateChange();
    componentState.liveControlCurrentTime.set(99);
    componentState.liveControlEndTime.set(100);
    componentState.seekLiveVideoToEdge();

    expect(video.playbackRate).toBe(2);
    expect(componentState.startWebRtcPlaybackFromSession).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('keeps 2x HLS active at the stable sync position while the visible gap exceeds one second', fakeAsync(() => {
    spectator = createComponent();
    const bufferedRange = fakeTimeRanges([[0, 90]]);
    const video = fakeLiveVideo({
      currentTime: 35,
      paused: false,
      playbackRate: 1,
      buffered: bufferedRange,
      seekable: bufferedRange,
    });
    const componentState = spectator.component as unknown as {
      hls: Hls | null;
      hlsLiveSession: { set: (value: HarborAssistantCameraLiveSessionResponse) => void };
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveControlCurrentTime: { set: (value: number) => void };
      liveControlEndTime: { set: (value: number) => void };
      liveControlPlaybackMode: { set: (value: 'hls-timeshift') => void } & (() => string);
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoRateChange: () => void;
      onLiveVideoSeeked: () => void;
      onLiveVideoTimeUpdate: () => void;
      startWebRtcPlaybackFromSession: jest.Mock;
      syncLiveControlState: jest.Mock;
    };
    componentState.hlsLiveSession.set(liveSession({
      webrtc_status: 'ready',
      webrtc_url: '/api/harbor-link/media/live-test/whep',
    }));
    componentState.hlsLiveUrl.set('/api/beacon/cameras/cam-1/live/live-test/index.m3u8');
    componentState.hlsLiveStatus.set('live');
    componentState.liveControlPlaybackMode.set('hls-timeshift');
    componentState.liveVideo = { nativeElement: video };
    componentState.hls = { liveSyncPosition: 88, destroy: jest.fn() } as unknown as Hls;
    componentState.startWebRtcPlaybackFromSession = jest.fn(() => true);

    componentState.onLiveVideoSeeked();
    video.playbackRate = 2;
    componentState.onLiveVideoRateChange();
    componentState.liveControlCurrentTime.set(98.9);
    componentState.liveControlEndTime.set(100);
    componentState.syncLiveControlState = jest.fn();
    video.currentTime = 86.5;
    componentState.onLiveVideoTimeUpdate();

    expect(video.playbackRate).toBe(2);

    video.currentTime = 87.1;
    componentState.onLiveVideoTimeUpdate();

    expect(video.playbackRate).toBe(2);
    expect(componentState.liveControlPlaybackMode()).toBe('hls-timeshift');
    expect(componentState.startWebRtcPlaybackFromSession).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('switches 2x HLS playback to WebRTC below a one-second visible gap', fakeAsync(() => {
    spectator = createComponent();
    const bufferedRange = fakeTimeRanges([[0, 90]]);
    const video = fakeLiveVideo({
      currentTime: 80,
      paused: false,
      playbackRate: 1,
      buffered: bufferedRange,
      seekable: bufferedRange,
    });
    const session = liveSession({
      webrtc_status: 'ready',
      webrtc_url: '/api/harbor-link/media/live-test/whep',
    });
    const componentState = spectator.component as unknown as {
      hlsLiveSession: { set: (value: HarborAssistantCameraLiveSessionResponse) => void };
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: 'live') => void };
      liveControlCurrentTime: { set: (value: number) => void };
      liveControlEndTime: { set: (value: number) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoRateChange: () => void;
      onLiveVideoSeeked: () => void;
      onLiveVideoTimeUpdate: () => void;
      startWebRtcPlaybackFromSession: jest.Mock;
      syncLiveControlState: jest.Mock;
    };
    componentState.hlsLiveSession.set(session);
    componentState.hlsLiveUrl.set('/api/beacon/cameras/cam-1/live/live-test/index.m3u8');
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: video };
    componentState.startWebRtcPlaybackFromSession = jest.fn(() => true);

    componentState.onLiveVideoSeeked();
    video.playbackRate = 2;
    componentState.onLiveVideoRateChange();
    componentState.liveControlCurrentTime.set(99.1);
    componentState.liveControlEndTime.set(100);
    componentState.syncLiveControlState = jest.fn();
    componentState.onLiveVideoTimeUpdate();

    expect(componentState.startWebRtcPlaybackFromSession).toHaveBeenCalledWith(session);
    expect(video.playbackRate).toBe(1);
    discardPeriodicTasks();
  }));

  it('switches HLS playback to WebRTC when the user seeks to the visible right edge', fakeAsync(() => {
    spectator = createComponent();
    const bufferedRange = fakeTimeRanges([[0, 90]]);
    const video = fakeLiveVideo({
      currentTime: 70,
      paused: false,
      playbackRate: 2,
      buffered: bufferedRange,
      seekable: bufferedRange,
    });
    const session = liveSession({
      webrtc_status: 'ready',
      webrtc_url: '/api/harbor-link/media/live-test/whep',
    });
    const componentState = spectator.component as unknown as {
      hlsLiveSession: { set: (value: HarborAssistantCameraLiveSessionResponse) => void };
      liveControlEndTime: { set: (value: number) => void };
      liveControlPlaybackMode: { set: (value: 'hls-timeshift') => void };
      liveControlStartTime: { set: (value: number) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      seekLivePlaybackFromControls: (seconds: number) => void;
      startWebRtcPlaybackFromSession: jest.Mock;
    };
    componentState.hlsLiveSession.set(session);
    componentState.liveControlPlaybackMode.set('hls-timeshift');
    componentState.liveControlStartTime.set(0);
    componentState.liveControlEndTime.set(100);
    componentState.liveVideo = { nativeElement: video };
    componentState.startWebRtcPlaybackFromSession = jest.fn(() => true);

    componentState.seekLivePlaybackFromControls(100);

    expect(componentState.startWebRtcPlaybackFromSession).toHaveBeenCalledWith(session);
    expect(video.currentTime).toBe(70);
    expect(video.playbackRate).toBe(1);
    discardPeriodicTasks();
  }));

  it('checks the live edge every second while delayed playback is catching up', fakeAsync(() => {
    spectator = createComponent();
    const bufferedRange = fakeTimeRanges([[0, 90]]);
    const video = fakeLiveVideo({
      currentTime: 35,
      paused: false,
      playbackRate: 1,
      buffered: bufferedRange,
      seekable: bufferedRange,
    });
    const session = liveSession({
      webrtc_status: 'ready',
      webrtc_url: '/api/harbor-link/media/live-test/whep',
    });
    const componentState = spectator.component as unknown as {
      hls: Hls | null;
      hlsLiveSession: { set: (value: HarborAssistantCameraLiveSessionResponse) => void };
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveControlCurrentTime: { set: (value: number) => void };
      liveControlEndTime: { set: (value: number) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoRateChange: () => void;
      onLiveVideoSeeked: () => void;
      startLiveEdgeMonitor: () => void;
      startWebRtcPlaybackFromSession: jest.Mock;
      syncLiveControlState: jest.Mock;
    };
    componentState.hlsLiveSession.set(session);
    componentState.hlsLiveUrl.set('/api/beacon/cameras/cam-1/live/live-test/index.m3u8');
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: video };
    componentState.hls = { liveSyncPosition: 88, destroy: jest.fn() } as unknown as Hls;

    componentState.onLiveVideoSeeked();
    video.playbackRate = 2;
    componentState.onLiveVideoRateChange();
    componentState.liveControlCurrentTime.set(99.1);
    componentState.liveControlEndTime.set(100);
    componentState.startWebRtcPlaybackFromSession = jest.fn(() => true);
    componentState.syncLiveControlState = jest.fn();
    video.currentTime = 87.1;
    componentState.startLiveEdgeMonitor();

    tick(999);
    expect(video.playbackRate).toBe(2);

    tick(1);
    expect(componentState.startWebRtcPlaybackFromSession).toHaveBeenCalledWith(session);
    expect(video.playbackRate).toBe(1);
    discardPeriodicTasks();
  }));

  it('keeps a native HLS seek delayed until the custom control requests WebRTC', fakeAsync(() => {
    spectator = createComponent();
    const bufferedRange = fakeTimeRanges([[0, 90]]);
    const video = fakeLiveVideo({
      currentTime: 89.5,
      paused: false,
      playbackRate: 1,
      buffered: bufferedRange,
      seekable: bufferedRange,
    });
    const componentState = spectator.component as unknown as {
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoSeeked: () => void;
      seekLiveVideoToEdge: (force?: boolean) => void;
    };
    componentState.hlsLiveUrl.set('/api/beacon/cameras/cam-1/live/live-test/index.m3u8');
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: video };

    componentState.onLiveVideoSeeked();
    video.currentTime = 50;
    componentState.seekLiveVideoToEdge(true);

    expect(video.currentTime).toBe(50);
    expect(video.playbackRate).toBe(1);
    discardPeriodicTasks();
  }));

  it('does not treat internal live-edge seeking as a user-selected history position', fakeAsync(() => {
    spectator = createComponent();
    const bufferedRange = fakeTimeRanges([[0, 90]]);
    const video = fakeLiveVideo({
      currentTime: 20,
      paused: false,
      playbackRate: 1,
      buffered: bufferedRange,
      seekable: bufferedRange,
    });
    const componentState = spectator.component as unknown as {
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoSeeked: () => void;
      seekLiveVideoToEdge: (force?: boolean) => void;
    };
    componentState.hlsLiveUrl.set('/api/beacon/cameras/cam-1/live/live-test/index.m3u8');
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: video };

    componentState.seekLiveVideoToEdge(true);
    componentState.onLiveVideoSeeked();
    video.currentTime = 30;
    componentState.seekLiveVideoToEdge(true);

    expect(video.currentTime).toBe(89);
    expect(video.playbackRate).toBe(1);
    discardPeriodicTasks();
  }));

  it('prefers hls.js when native HLS probing is unreliable', fakeAsync(() => {
    spectator = createComponent();
    const playlistUrl = '/api/beacon/cameras/cam-1/live/live-test/index.m3u8';
    const isSupported = jest.spyOn(Hls, 'isSupported').mockReturnValue(true);
    const loadSource = jest.spyOn(Hls.prototype, 'loadSource').mockImplementation(jest.fn());
    const attachMedia = jest.spyOn(Hls.prototype, 'attachMedia').mockImplementation(jest.fn());
    jest.spyOn(Hls.prototype, 'on').mockImplementation(jest.fn());
    jest.spyOn(Hls.prototype, 'destroy').mockImplementation(jest.fn());
    const componentState = spectator.component as unknown as {
      attachHlsPlayback: () => boolean;
      hls?: {
        config?: {
          backBufferLength?: number;
          liveMaxLatencyDurationCount?: number;
          lowLatencyMode?: boolean;
          maxBufferLength?: number;
          maxMaxBufferLength?: number;
          maxLiveSyncPlaybackRate?: number;
        };
        userConfig?: {
          liveMaxLatencyDurationCount?: number;
          liveSyncDurationCount?: number;
        };
      };
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
    };
    const video = {
      autoplay: false,
      canPlayType: jest.fn(() => 'maybe'),
      currentTime: 0,
      defaultMuted: false,
      load: jest.fn(),
      muted: false,
      pause: jest.fn(),
      paused: true,
      play: jest.fn(() => Promise.resolve()),
      playsInline: false,
      removeAttribute: jest.fn(),
    } as unknown as HTMLVideoElement;
    componentState.hlsLiveUrl.set(playlistUrl);
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: video };

    expect(componentState.attachHlsPlayback()).toBe(true);

    expect(isSupported).toHaveBeenCalled();
    expect(video.autoplay).toBe(true);
    expect(video.defaultMuted).toBe(true);
    expect(video.muted).toBe(true);
    expect(loadSource).toHaveBeenCalledWith(playlistUrl);
    expect(attachMedia).toHaveBeenCalledWith(video);
    expect(video.canPlayType).not.toHaveBeenCalled();
    expect(componentState.hls?.config?.backBufferLength).toBe(Number.POSITIVE_INFINITY);
    expect(componentState.hls?.config?.liveMaxLatencyDurationCount).toBe(Number.POSITIVE_INFINITY);
    expect(componentState.hls?.config?.lowLatencyMode).toBe(true);
    expect(componentState.hls?.config?.maxBufferLength).toBe(120);
    expect(componentState.hls?.config?.maxMaxBufferLength).toBe(600);
    expect(componentState.hls?.config?.maxLiveSyncPlaybackRate).toBe(1);
    expect(componentState.hls?.userConfig?.liveMaxLatencyDurationCount).toBeUndefined();
    expect(componentState.hls?.userConfig?.liveSyncDurationCount).toBeUndefined();
    discardPeriodicTasks();
  }));

  it('keeps live starting until HLS media is buffered', fakeAsync(() => {
    spectator = createComponent();
    const playlistUrl = '/api/beacon/cameras/cam-1/live/live-test/index.m3u8';
    const hlsHandlers = new Map<string, (event: string, data?: unknown) => void>();
    jest.spyOn(Hls, 'isSupported').mockReturnValue(true);
    jest.spyOn(Hls.prototype, 'loadSource').mockImplementation(jest.fn());
    jest.spyOn(Hls.prototype, 'attachMedia').mockImplementation(jest.fn());
    jest.spyOn(Hls.prototype, 'destroy').mockImplementation(jest.fn());
    jest.spyOn(Hls.prototype, 'on').mockImplementation((event, handler) => {
      hlsHandlers.set(event, handler as (event: string, data?: unknown) => void);
    });
    const componentState = spectator.component as unknown as {
      attachHlsPlayback: () => boolean;
      hlsLiveStatus: {
        set: (value: HlsLiveStatus) => void;
      } & (() => string);
      hlsLiveUrl: { set: (value: string | null) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
    };
    componentState.hlsLiveUrl.set(playlistUrl);
    componentState.hlsLiveStatus.set('starting');
    componentState.liveVideo = { nativeElement: fakeLiveVideo() };

    expect(componentState.attachHlsPlayback()).toBe(true);
    hlsHandlers.get(Hls.Events.MANIFEST_PARSED)?.('manifestParsed');

    expect(componentState.hlsLiveStatus()).toBe('starting');

    hlsHandlers.get(Hls.Events.FRAG_BUFFERED)?.('fragBuffered');

    expect(componentState.hlsLiveStatus()).toBe('live');
    discardPeriodicTasks();
  }));

  it('restores the pending HLS time-shift after the first fragment becomes seekable', fakeAsync(() => {
    spectator = createComponent();
    const playlistUrl = '/api/beacon/cameras/cam-1/live/live-test/index.m3u8';
    const hlsHandlers = new Map<string, (event: string, data?: unknown) => void>();
    jest.spyOn(Hls, 'isSupported').mockReturnValue(true);
    jest.spyOn(Hls.prototype, 'loadSource').mockImplementation(jest.fn());
    jest.spyOn(Hls.prototype, 'attachMedia').mockImplementation(jest.fn());
    jest.spyOn(Hls.prototype, 'destroy').mockImplementation(jest.fn());
    jest.spyOn(Hls.prototype, 'on').mockImplementation((event, handler) => {
      hlsHandlers.set(event, handler as (event: string, data?: unknown) => void);
    });
    let seekableRange = fakeTimeRanges([]);
    const video = fakeLiveVideo({
      currentTime: 0,
      paused: true,
    });
    Object.defineProperty(video, 'seekable', {
      configurable: true,
      get: () => seekableRange,
    });
    const componentState = spectator.component as unknown as {
      attachHlsPlayback: () => boolean;
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      hlsLiveUrl: { set: (value: string | null) => void };
      liveControlPlaybackMode: { set: (value: 'webrtc' | 'hls-timeshift' | 'hls-fallback') => void };
      livePlaybackUserDelayed: boolean;
      livePlaybackUserPaused: boolean;
      liveVideo?: { nativeElement: HTMLVideoElement };
      pendingHlsBehindLiveSeconds: number | null;
    };
    componentState.hlsLiveUrl.set(playlistUrl);
    componentState.hlsLiveStatus.set('starting');
    componentState.liveControlPlaybackMode.set('hls-timeshift');
    componentState.livePlaybackUserDelayed = true;
    componentState.livePlaybackUserPaused = true;
    componentState.pendingHlsBehindLiveSeconds = 30;
    componentState.liveVideo = { nativeElement: video };

    expect(componentState.attachHlsPlayback()).toBe(true);
    hlsHandlers.get(Hls.Events.MANIFEST_PARSED)?.('manifestParsed');

    expect(video.currentTime).toBe(0);
    expect(componentState.pendingHlsBehindLiveSeconds).toBe(30);

    seekableRange = fakeTimeRanges([[0, 100]]);
    hlsHandlers.get(Hls.Events.FRAG_BUFFERED)?.('fragBuffered');

    expect(video.currentTime).toBe(70);
    expect(componentState.pendingHlsBehindLiveSeconds).toBeNull();
    expect(video.play).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('keeps HLS fragment buffering from overriding a user pause', fakeAsync(() => {
    spectator = createComponent();
    const playlistUrl = '/api/beacon/cameras/cam-1/live/live-test/index.m3u8';
    const hlsHandlers = new Map<string, (event: string, data?: unknown) => void>();
    const loadSource = jest.spyOn(Hls.prototype, 'loadSource').mockImplementation(jest.fn());
    jest.spyOn(Hls, 'isSupported').mockReturnValue(true);
    jest.spyOn(Hls.prototype, 'attachMedia').mockImplementation(jest.fn());
    jest.spyOn(Hls.prototype, 'destroy').mockImplementation(jest.fn());
    jest.spyOn(Hls.prototype, 'on').mockImplementation((event, handler) => {
      hlsHandlers.set(event, handler as (event: string, data?: unknown) => void);
    });
    const bufferedRange = fakeTimeRanges([[0, 90]]);
    const video = fakeLiveVideo({
      currentTime: 14,
      paused: true,
      buffered: bufferedRange,
      seekable: bufferedRange,
    });
    const componentState = spectator.component as unknown as {
      attachHlsPlayback: () => boolean;
      hlsLiveUrl: { set: (value: string | null) => void };
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
      onLiveVideoPause: () => void;
    };
    componentState.hlsLiveUrl.set(playlistUrl);
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: video };

    expect(componentState.attachHlsPlayback()).toBe(true);
    spectator.component.onLiveVideoPlaying();
    componentState.onLiveVideoPause();
    video.currentTime = 20;
    hlsHandlers.get(Hls.Events.FRAG_BUFFERED)?.('fragBuffered');
    tick();
    flushMicrotasks();

    expect(loadSource).toHaveBeenCalledWith(playlistUrl);
    expect(video.currentTime).toBe(14);
    expect(video.play).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('recovers fatal hls.js media errors before degrading live playback', fakeAsync(() => {
    spectator = createComponent();
    const playlistUrl = '/api/beacon/cameras/cam-1/live/live-test/index.m3u8';
    const hlsHandlers = new Map<
      string,
      (event: string, data: { details: string; fatal: boolean; type: string }) => void
    >();
    const recoverMediaError = jest.spyOn(Hls.prototype, 'recoverMediaError').mockImplementation(jest.fn());
    jest.spyOn(Hls, 'isSupported').mockReturnValue(true);
    jest.spyOn(Hls.prototype, 'loadSource').mockImplementation(jest.fn());
    jest.spyOn(Hls.prototype, 'attachMedia').mockImplementation(jest.fn());
    jest.spyOn(Hls.prototype, 'destroy').mockImplementation(jest.fn());
    jest.spyOn(Hls.prototype, 'on').mockImplementation((event, handler) => {
      hlsHandlers.set(
        event,
        handler as (event: string, data: { details: string; fatal: boolean; type: string }) => void,
      );
    });
    const componentState = spectator.component as unknown as {
      attachHlsPlayback: () => boolean;
      hlsLiveError: () => string | null;
      hlsLiveStatus: {
        set: (value: HlsLiveStatus) => void;
      } & (() => string);
      hlsLiveUrl: { set: (value: string | null) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
    };
    componentState.hlsLiveUrl.set(playlistUrl);
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: fakeLiveVideo() };

    expect(componentState.attachHlsPlayback()).toBe(true);
    hlsHandlers.get(Hls.Events.ERROR)?.('hlsError', {
      details: 'bufferAppendError',
      fatal: true,
      type: 'mediaError',
    });

    expect(recoverMediaError).toHaveBeenCalled();
    expect(componentState.hlsLiveStatus()).toBe('live');
    expect(componentState.hlsLiveError()).toBe('Live HLS media error; retrying (mediaError/bufferAppendError).');
    tick();
    discardPeriodicTasks();
  }));

  it('degrades expired HLS live sessions without recovery loops', fakeAsync(() => {
    spectator = createComponent();
    const playlistUrl = '/api/beacon/cameras/cam-1/live/live-test/index.m3u8';
    const hlsHandlers = new Map<string, (event: string, data: {
      details: string;
      fatal: boolean;
      response?: { code: number };
      type: string;
    }) => void>();
    const startLoad = jest.spyOn(Hls.prototype, 'startLoad').mockImplementation(jest.fn());
    jest.spyOn(Hls, 'isSupported').mockReturnValue(true);
    jest.spyOn(Hls.prototype, 'loadSource').mockImplementation(jest.fn());
    jest.spyOn(Hls.prototype, 'attachMedia').mockImplementation(jest.fn());
    jest.spyOn(Hls.prototype, 'destroy').mockImplementation(jest.fn());
    jest.spyOn(Hls.prototype, 'on').mockImplementation((event, handler) => {
      hlsHandlers.set(
        event,
        handler as (event: string, data: {
          details: string;
          fatal: boolean;
          response?: { code: number };
          type: string;
        }) => void,
      );
    });
    const componentState = spectator.component as unknown as {
      attachHlsPlayback: () => boolean;
      hlsLiveError: () => string | null;
      hlsLiveStatus: {
        set: (value: HlsLiveStatus) => void;
      } & (() => string);
      hlsLiveUrl: { set: (value: string | null) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
    };
    componentState.hlsLiveUrl.set(playlistUrl);
    componentState.hlsLiveStatus.set('live');
    componentState.liveVideo = { nativeElement: fakeLiveVideo() };

    expect(componentState.attachHlsPlayback()).toBe(true);
    hlsHandlers.get(Hls.Events.ERROR)?.('hlsError', {
      details: 'fragLoadError',
      fatal: true,
      response: { code: 404 },
      type: 'networkError',
    });

    expect(startLoad).not.toHaveBeenCalled();
    expect(componentState.hlsLiveStatus()).toBe('degraded');
    expect(componentState.hlsLiveError()).toBe('Live session expired. Start live playback again.');
    tick();
    discardPeriodicTasks();
  }));

  it('retries startup HLS 404 responses before degrading the session', fakeAsync(() => {
    spectator = createComponent();
    const playlistUrl = '/api/beacon/cameras/cam-1/live/live-test/index.m3u8';
    const hlsHandlers = new Map<string, (event: string, data: {
      details: string;
      fatal: boolean;
      response?: { code: number };
      type: string;
    }) => void>();
    const startLoad = jest.spyOn(Hls.prototype, 'startLoad').mockImplementation(jest.fn());
    jest.spyOn(Hls, 'isSupported').mockReturnValue(true);
    jest.spyOn(Hls.prototype, 'loadSource').mockImplementation(jest.fn());
    jest.spyOn(Hls.prototype, 'attachMedia').mockImplementation(jest.fn());
    jest.spyOn(Hls.prototype, 'destroy').mockImplementation(jest.fn());
    jest.spyOn(Hls.prototype, 'on').mockImplementation((event, handler) => {
      hlsHandlers.set(
        event,
        handler as (event: string, data: {
          details: string;
          fatal: boolean;
          response?: { code: number };
          type: string;
        }) => void,
      );
    });
    const componentState = spectator.component as unknown as {
      attachHlsPlayback: () => boolean;
      hlsLiveError: () => string | null;
      hlsLiveStatus: {
        set: (value: HlsLiveStatus) => void;
      } & (() => string);
      hlsLiveUrl: { set: (value: string | null) => void };
      liveVideo?: { nativeElement: HTMLVideoElement };
    };
    componentState.hlsLiveUrl.set(playlistUrl);
    componentState.hlsLiveStatus.set('starting');
    componentState.liveVideo = { nativeElement: fakeLiveVideo() };

    expect(componentState.attachHlsPlayback()).toBe(true);
    hlsHandlers.get(Hls.Events.ERROR)?.('hlsError', {
      details: 'fragLoadError',
      fatal: true,
      response: { code: 404 },
      type: 'networkError',
    });

    expect(componentState.hlsLiveStatus()).toBe('starting');
    expect(componentState.hlsLiveError()).toContain('retrying 1/5');
    expect(startLoad).not.toHaveBeenCalled();

    tick(1_000);

    expect(startLoad).toHaveBeenCalledTimes(1);
    expect(componentState.hlsLiveStatus()).toBe('starting');
    discardPeriodicTasks();
  }));

  it('freezes snapshot polling while recording is active', fakeAsync(() => {
    api.cameraState = jest.fn(() => of(cameraState({
      snapshotUrl: null,
      snapshotCapability: false,
    })));
    api.dvrStatus = jest.fn(() => of(dvrStatus('recording')));
    spectator = createComponent();
    const componentState = spectator.component as unknown as {
      liveSnapshotToken: () => number;
    };
    const token = componentState.liveSnapshotToken();

    tick(3000);

    expect(componentState.liveSnapshotToken()).toBe(token);
    discardPeriodicTasks();
  }));

  it('keeps the last good live frame when a snapshot refresh fails', fakeAsync(() => {
    spectator = createComponent();
    const componentState = spectator.component as unknown as {
      hlsLiveStatus: { set: (value: HlsLiveStatus) => void };
      lastGoodLiveFrameUrl: { set: (value: string) => void };
      liveSnapshotErrorToken: { set: (value: number) => void };
      liveSnapshotToken: () => number;
    };
    const token = componentState.liveSnapshotToken();

    componentState.hlsLiveStatus.set('starting');
    componentState.lastGoodLiveFrameUrl.set('data:image/jpeg;base64,good-frame');
    componentState.liveSnapshotErrorToken.set(token);

    expect(spectator.component.selectedLiveUrl()).toBe('data:image/jpeg;base64,good-frame');
    discardPeriodicTasks();
  }));

  it('does not expose raw camera state parsing errors', fakeAsync(() => {
    api.cameraState = jest.fn(() => throwError(() => new Error('failed to parse admin console state: EOF while parsing a value')));
    spectator = createComponent();
    spectator.detectChanges();

    expect(spectator.element.textContent).toContain('Camera settings did not fully refresh');
    expect(spectator.element.textContent).not.toContain('failed to parse admin console');
    discardPeriodicTasks();
  }));

  it('does not refresh the main live image immediately after snapshot', fakeAsync(() => {
    spectator = createComponent();
    const componentState = spectator.component as unknown as {
      liveSnapshotToken: () => number;
    };
    const token = componentState.liveSnapshotToken();

    spectator.component.captureSnapshot();

    expect(componentState.liveSnapshotToken()).toBe(token);
    discardPeriodicTasks();
  }));

  it('shows an optimistic snapshot card before the archive request finishes', fakeAsync(() => {
    spectator = createComponent();

    spectator.component.captureSnapshot();
    spectator.detectChanges();

    expect(api.createSnapshotTask).toHaveBeenCalledWith('cam-1');
    expect(spectator.query('.live-feedback')).toHaveText('Captured');
    expect(spectator.queryAll('.recent-media-card.snapshot.pending')).toHaveLength(1);
    expect(spectator.component.timelineItems()[0].file_path).toContain('ui://harbor-assistant-camera/snapshot:cam-1');
    tick(3000);
    discardPeriodicTasks();
  }));

  it('releases the snapshot button before archive finishes', fakeAsync(() => {
    spectator = createComponent();

    spectator.component.captureSnapshot();
    spectator.detectChanges();
    const componentState = spectator.component as unknown as {
      actionBusy: () => string | null;
    };
    expect(componentState.actionBusy()).toBe('snapshot');

    tick(500);
    spectator.detectChanges();

    expect(componentState.actionBusy()).toBeNull();
    expect(api.createSnapshotTask).toHaveBeenCalledWith('cam-1');
    tick(2500);
    discardPeriodicTasks();
  }));

  it('replaces the optimistic snapshot with the archived media item', fakeAsync(() => {
    spectator = createComponent();

    spectator.component.captureSnapshot();
    snapshotSubject$.next({
      media_item: {
        device_id: 'cam-1',
        file_path: '/library/snapshots/cam-1.jpg',
        media_kind: 'snapshot',
        stream_kind: 'snapshot',
        started_at: '1714600100',
        created_at: '1714600100',
        ended_at: '1714600100',
        duration_seconds: 0,
        retention_expires_at: '',
        size_bytes: 1536,
        replay_url: '/api/knowledge/preview?path=/library/snapshots/cam-1.jpg',
        thumbnail_url: '/api/knowledge/preview?path=/library/snapshots/cam-1.jpg',
        playable: true,
        indexed: false,
      },
    });
    snapshotSubject$.complete();
    spectator.detectChanges();

    expect(spectator.queryAll('.recent-media-card.snapshot.pending')).toHaveLength(0);
    expect(spectator.component.timelineItems()[0].file_path).toBe('/library/snapshots/cam-1.jpg');
    tick(3000);
    discardPeriodicTasks();
  }));

  it('opens DVR media in an inline viewer instead of a popup', fakeAsync(() => {
    const windowOpen = jest.spyOn(globalThis, 'open').mockImplementation(() => null);
    spectator = createComponent();
    spectator.detectChanges();

    spectator.component.openReplay(spectator.component.timelineItems()[0]);
    tick();
    spectator.detectChanges();

    expect(windowOpen).not.toHaveBeenCalled();
    expect(spectator.query('[data-testid="harbor-assistant-camera-media-viewer"]')).toExist();
    expect(spectator.query('[data-testid="harbor-assistant-camera-media-viewer"] video')).toExist();
    windowOpen.mockRestore();
    discardPeriodicTasks();
  }));

  it('restores the selected playback seek target when media readiness resets the video time', fakeAsync(() => {
    spectator = createComponent();
    spectator.detectChanges();
    spectator.component.openReplay(spectator.component.timelineItems()[0]);
    tick();

    const video = playbackVideoElement(60);
    video.currentTime = 12;
    spectator.component.onPlaybackVideoSeeking(videoEvent('seeking', video));
    video.currentTime = 0;

    spectator.component.onPlaybackVideoReady(videoEvent('canplay', video));

    expect(video.currentTime).toBe(12);
    discardPeriodicTasks();
  }));

  it('labels media library recordings as videos', fakeAsync(() => {
    spectator = createComponent();
    spectator.detectChanges();

    expect(spectator.component.mediaKindLabel(spectator.component.timelineItems()[0])).toBe('Video');
    discardPeriodicTasks();
  }));

  it('searches camera events in the DVR media library without changing the selected camera', fakeAsync(() => {
    spectator = createComponent();
    (spectator.component as unknown as {
      form: { controls: { query: { setValue: (value: string) => void } } };
    }).form.controls.query.setValue('谁倒了啤酒');
    const selectedBefore = spectator.component.selectedCameraLabel();
    spectator.component.search();
    spectator.detectChanges();
    tick();
    spectator.detectChanges();

    expect(api.search).toHaveBeenCalledWith(expect.objectContaining({
      source_scope: 'dvr_library',
      include_videos: true,
    }));
    expect(spectator.component.selectedCameraLabel()).toBe(selectedBefore);
    expect(scrollIntoViewSpy).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('renders live and playback tabs', fakeAsync(() => {
    spectator = createComponent();
    spectator.detectChanges();
    tick();
    spectator.detectChanges();

    expect(spectator.query('mat-tab-group')).toExist();
    expect(spectator.query(MatTabGroup)?.preserveContent).toBe(true);
    expect(spectator.fixture.nativeElement.textContent).toContain('Live');
    expect(spectator.fixture.nativeElement.textContent).toContain('Playback');
    expect(spectator.fixture.nativeElement.textContent).not.toContain('Harbor Assistant Camera');
    discardPeriodicTasks();
  }));

  it('uses the camera room as the live title and keeps the camera name in the selector', fakeAsync(() => {
    api.cameraState = jest.fn(() => of(cameraState({
      cameraName: 'TP1',
      room: '客厅',
    })));
    spectator = createComponent();
    spectator.detectChanges();

    expect(spectator.query('.workbench-header h2')).toHaveText('客厅');
    expect(spectator.query('.camera-pills')).toHaveText('TP1');
    discardPeriodicTasks();
  }));

  it('keeps public DVR fixtures out of the live camera selector', fakeAsync(() => {
    api.cameraState = jest.fn(() => of(cameraState({ includeFixture: true })));
    spectator = createComponent();
    spectator.detectChanges();

    expect(spectator.query('.camera-pills')).toHaveText('Camera 192.168.3.231');
    expect(spectator.query('.camera-pills')).not.toHaveText('Public DVR Fixture');
    discardPeriodicTasks();
  }));

  it('sorts finalized recordings by the visible finalize time when available', fakeAsync(() => {
    spectator = createComponent();
    const componentState = spectator.component as unknown as {
      dvrTimeline: { set: (items: unknown[]) => void };
      optimisticMediaItems: { set: (items: unknown[]) => void };
      timelineItems: () => { file_path: string }[];
    };

    componentState.optimisticMediaItems.set([
      {
        device_id: 'cam-1',
        file_path: 'ui://recording',
        media_kind: 'recording',
        stream_kind: 'recording',
        started_at: '200',
        created_at: '200',
        ended_at: '200',
        duration_seconds: 0,
        retention_expires_at: '',
        size_bytes: 0,
        playable: false,
        indexed: false,
        local_status: 'finalizing',
        optimistic_key: 'recording:cam-1:200',
        local_display_at: '200',
      },
    ]);
    componentState.dvrTimeline.set([
      {
        device_id: 'cam-1',
        file_path: '/library/snapshot.jpg',
        media_kind: 'snapshot',
        stream_kind: 'snapshot',
        started_at: '150',
        created_at: '150',
        ended_at: '150',
        duration_seconds: 0,
        retention_expires_at: '',
        size_bytes: 100,
        playable: true,
        indexed: false,
      },
      {
        device_id: 'cam-1',
        file_path: '/library/recording.mp4',
        media_kind: 'recording',
        stream_kind: 'substream',
        started_at: '120',
        created_at: '120',
        ended_at: '200',
        duration_seconds: 80,
        retention_expires_at: '',
        size_bytes: 1000,
        playable: true,
        indexed: true,
        local_display_at: '200',
      },
    ]);

    expect(componentState.timelineItems()[0].file_path).toBe('ui://recording');
    expect(componentState.timelineItems()[1].file_path).toBe('/library/recording.mp4');
    discardPeriodicTasks();
  }));

  it('shows a starting recording badge before the start request resolves', fakeAsync(() => {
    const startSubject$ = new Subject<HarborAssistantSearchDvrStatusResponse>();
    api.startDvrRecording = jest.fn(() => startSubject$.asObservable());
    spectator = createComponent();
    const componentState = spectator.component as unknown as {
      selectedStreamProfile: { set: (value: 'sub' | 'main') => void };
    };
    componentState.selectedStreamProfile.set('main');

    spectator.component.startRecording();
    spectator.detectChanges();

    expect(api.startDvrRecording).toHaveBeenCalledWith('cam-1', 'main');
    expect(spectator.query('.recording-badge')).toHaveText('Starting');

    api.dvrStatus = jest.fn(() => of(dvrStatus('recording')));
    startSubject$.next(dvrStatus('recording'));
    startSubject$.complete();
    spectator.detectChanges();

    expect(spectator.query('.recording-badge')).toHaveText('REC');
    tick(3000);
    discardPeriodicTasks();
  }));

  it('reports a recording that never appears in Playback instead of finalizing forever', fakeAsync(() => {
    api.dvrStatus = jest.fn(() => of(dvrStatus('recording')));
    const stopSubject$ = new Subject<HarborAssistantSearchDvrStatusResponse>();
    api.stopDvrRecording = jest.fn(() => stopSubject$.asObservable());
    spectator = createComponent();
    spectator.detectChanges();

    spectator.component.stopRecording();
    spectator.detectChanges();

    expect(spectator.query('.recording-badge')).toHaveText('Finalizing');
    expect(spectator.queryAll('.recent-media-card.pending').length).toBeGreaterThan(0);

    stopSubject$.next(dvrStatus('stopped'));
    stopSubject$.complete();
    spectator.detectChanges();
    expect(spectator.query('.recording-badge')).toHaveText('Finalizing');
    tick(9000);
    spectator.detectChanges();

    const componentState = spectator.component as unknown as {
      actionError: () => string | null;
      recordIntent: () => string | null;
      timelineItems: () => { local_status?: string }[];
    };
    expect(componentState.recordIntent()).toBeNull();
    expect(componentState.actionError()).toContain('did not appear in Playback');
    expect(componentState.timelineItems()[0].local_status).toBe('finalize_failed');
    discardPeriodicTasks();
  }));

  it('replaces the finalizing card when the saved recording appears in Playback', fakeAsync(() => {
    const finalizedAt = Math.floor(Date.now() / 1000);
    const finalizedTimeline: HarborAssistantSearchDvrTimelineResponse = {
      ...dvrTimeline(),
      segments: [{
        ...dvrTimeline().segments[0],
        file_path: 'harborlink://dvr/recording-1',
        started_at: String(finalizedAt - 12),
        created_at: String(finalizedAt - 12),
        ended_at: String(finalizedAt),
        replay_url: '/api/cameras/recordings/artifacts/recording-1',
      }],
    };
    api.dvrStatus = jest.fn(() => of(dvrStatus('recording')));
    api.dvrTimeline = jest.fn()
      .mockReturnValueOnce(of(dvrTimeline()))
      .mockReturnValue(of(finalizedTimeline));
    const stopSubject$ = new Subject<HarborAssistantSearchDvrStatusResponse>();
    api.stopDvrRecording = jest.fn(() => stopSubject$.asObservable());
    spectator = createComponent();
    spectator.detectChanges();

    spectator.component.stopRecording();
    stopSubject$.next(dvrStatus('stopped'));
    stopSubject$.complete();
    spectator.detectChanges();

    const componentState = spectator.component as unknown as {
      actionMessage: () => string | null;
      recordIntent: () => string | null;
      timelineItems: () => { file_path: string; optimistic_key?: string }[];
    };
    expect(componentState.recordIntent()).toBeNull();
    expect(componentState.actionMessage()).toBe('Recording is ready in Playback.');
    expect(componentState.timelineItems()[0].file_path).toBe('harborlink://dvr/recording-1');
    expect(componentState.timelineItems()[0].optimistic_key).toBeUndefined();
    discardPeriodicTasks();
  }));

  it('clears action messages while preserving action errors', fakeAsync(() => {
    spectator = createComponent();

    spectator.component.captureSnapshot();
    snapshotSubject$.error({ message: 'archive failed' });
    spectator.detectChanges();
    const componentState = spectator.component as unknown as {
      actionMessage: () => string | null;
      actionError: () => string | null;
    };
    expect(componentState.actionMessage()).toBe('Current preview was kept, but background archiving failed.');
    expect(componentState.actionError()).toBe('archive failed');

    tick(3000);
    spectator.detectChanges();

    expect(componentState.actionMessage()).toBeNull();
    expect(componentState.actionError()).toBe('archive failed');
    discardPeriodicTasks();
  }));
});

function cameraState(options: {
  cameraName?: string;
  room?: string | null;
  snapshotUrl?: string | null;
  snapshotCapability?: boolean;
  includeFixture?: boolean;
} = {}): HarborAssistantSearchCameraStateResponse {
  return {
    defaults: { selected_camera_device_id: 'cam-1' },
    devices: [
      {
        device_id: 'cam-1',
        name: options.cameraName ?? 'Camera 192.168.3.231',
        room: options.room,
        snapshot_url: options.snapshotUrl === undefined ? '/api/cameras/cam-1/snapshot.jpg' : options.snapshotUrl,
        capabilities: {
          snapshot: options.snapshotCapability ?? true,
          stream: true,
          ptz: false,
        },
      },
      ...(options.includeFixture
        ? [{
            device_id: 'public-fixture-dvr',
            name: 'Public DVR Fixture (not live camera)',
            snapshot_url: '/ui/assets/fixture.jpg',
            capabilities: {
              snapshot: false,
              stream: false,
              ptz: false,
            },
          }]
        : []),
    ],
  };
}

function dvrStatus(status = 'stopped'): HarborAssistantSearchDvrStatusResponse {
  return {
    generated_at: '1',
    statuses: [
      {
        device_id: 'cam-1',
        status,
        live_mjpeg_url: '/api/cameras/cam-1/live.mjpeg',
      },
    ],
  };
}

function fakeLiveVideo(options: Partial<HTMLVideoElement> & {
  cancelVideoFrameCallback?: (callbackId: number) => void;
  requestVideoFrameCallback?: (callback: () => void) => number;
} = {}): HTMLVideoElement {
  return {
    autoplay: false,
    canPlayType: jest.fn(() => 'maybe'),
    currentTime: 0,
    defaultMuted: false,
    load: jest.fn(),
    muted: false,
    pause: jest.fn(),
    paused: true,
    play: jest.fn(() => Promise.resolve()),
    playbackRate: 1,
    playsInline: false,
    removeAttribute: jest.fn(),
    ...options,
  } as unknown as HTMLVideoElement;
}

function fakeTransitionCanvas(): { canvas: HTMLCanvasElement; drawImage: jest.Mock } {
  const drawImage = jest.fn();
  const canvas = {
    getContext: jest.fn(() => ({ drawImage } as unknown as CanvasRenderingContext2D)),
    height: 0,
    width: 0,
  } as unknown as HTMLCanvasElement;
  return { canvas, drawImage };
}

function playbackVideoElement(duration: number): HTMLVideoElement {
  const video = document.createElement('video');
  Object.defineProperty(video, 'duration', { value: duration, configurable: true });
  Object.defineProperty(video, 'seekable', { value: fakeTimeRanges([[0, duration]]), configurable: true });
  return video;
}

function videoEvent(type: string, video: HTMLVideoElement): Event {
  const event = new Event(type);
  Object.defineProperty(event, 'target', { value: video, configurable: true });
  return event;
}

function fakeTimeRanges(ranges: (readonly [number, number])[]): TimeRanges {
  return {
    length: ranges.length,
    start: jest.fn((index: number) => ranges[index]?.[0] ?? 0),
    end: jest.fn((index: number) => ranges[index]?.[1] ?? 0),
  } as unknown as TimeRanges;
}

function liveSession(
  options: Partial<HarborAssistantCameraLiveSessionResponse> = {},
): HarborAssistantCameraLiveSessionResponse {
  return {
    device_id: 'cam-1',
    session_id: 'live-test',
    status: 'running',
    playlist_url: '/api/beacon/cameras/cam-1/live/live-test/index.m3u8',
    playlist_ready: true,
    mode: 'hls_fmp4',
    codec: 'h264_copy',
    stream_profile: 'sub',
    started_at: '1714600000',
    updated_at: '1714600001',
    message: 'H.264 live remux is running',
    ...options,
  };
}

function harborLinkCapabilities(
  webrtcStatus: 'ready' | 'degraded' | 'not_configured' = 'ready',
): HarborAssistantHarborLinkCapabilitiesResponse {
  return {
    ok: true,
    status: webrtcStatus === 'ready' ? 'ready' : 'degraded',
    contract: {
      version: '1.0',
      major: '1',
    },
    features: {
      camera: { status: 'ready' },
      homeAssistant: { status: 'ready' },
      recording: { status: 'ready' },
      hls: { status: 'ready', basePath: '/api/harbor-link/hls' },
      webrtc: { status: webrtcStatus, basePath: '/api/harbor-link/media' },
    },
  };
}

function dvrTimeline(): HarborAssistantSearchDvrTimelineResponse {
  return {
    generated_at: '1',
    recording_root: '/library',
    media_library_root: '/library',
    segments: [
      {
        device_id: 'cam-1',
        file_path: '/library/recordings/cam-1.mp4',
        media_kind: 'recording',
        stream_kind: 'substream',
        started_at: '1714600000',
        created_at: '1714600000',
        ended_at: '1714600060',
        duration_seconds: 60,
        duration_actual_seconds: 60,
        retention_expires_at: '',
        size_bytes: 4096,
        replay_url: '/api/knowledge/preview?path=/library/recordings/cam-1.mp4',
        thumbnail_url: '/api/knowledge/preview?path=/library/recordings/cam-1.mp4',
        playable: true,
        indexed: true,
      },
    ],
  };
}

function searchResponse(): HarborAssistantSearchResponse {
  return {
    query: '谁倒了啤酒',
    roots: [],
    total_matches: 1,
    documents: [],
    images: [],
    videos: [
      {
        modality: 'video',
        path: '/library/fixtures/beer.mp4',
        title: 'beer.mp4',
        score: 900,
        snippet: '有人在倒啤酒',
        content_source_kinds: ['video_sidecar'],
        content_indexed: true,
        filename_match_used: false,
        content_match_used: true,
      },
    ],
    reply_pack: { summary: '', citations: [] },
    supported_modalities: ['document', 'image', 'video'],
    pending_modalities: [],
    status: 'ok',
    degraded: false,
    blockers: [],
    warnings: [],
    source_scope: [],
    privacy_level: 'strict_local',
    resource_profile: 'cpu_only',
  };
}
