import { fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of, Subject, throwError } from 'rxjs';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { HarborAssistantCameraComponent } from 'app/pages/harbor-assistant/camera/harbor-assistant-camera.component';
import {
  HarborAssistantSearchCameraStateResponse,
  HarborAssistantSearchDvrStatusResponse,
  HarborAssistantSearchDvrTimelineResponse,
  HarborAssistantSearchResponse,
  HarborAssistantSearchSnapshotTaskResponse,
} from 'app/pages/harbor-assistant/shared/harbor-assistant.interface';
import { HarborAssistantContentApiService } from 'app/pages/harbor-assistant/shared/harbor-assistant-content-api.service';

describe('Harbor Assistant camera component', () => {
  let spectator: Spectator<HarborAssistantCameraComponent>;
  let snapshotSubject: Subject<HarborAssistantSearchSnapshotTaskResponse>;
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
    snapshotSubject = new Subject<HarborAssistantSearchSnapshotTaskResponse>();
    scrollIntoViewSpy = jest.fn();
    (Element.prototype as unknown as { scrollIntoView: jest.Mock }).scrollIntoView = scrollIntoViewSpy;
    api = {
      cameraState: jest.fn(() => of(cameraState())),
      dvrStatus: jest.fn(() => of(dvrStatus())),
      dvrTimeline: jest.fn(() => of(dvrTimeline())),
      createSnapshotTask: jest.fn(() => snapshotSubject.asObservable()),
      startDvrRecording: jest.fn(() => of(dvrStatus('recording'))),
      stopDvrRecording: jest.fn(() => of(dvrStatus('stopped'))),
      search: jest.fn(() => of(searchResponse())),
      previewUrl: jest.fn((path: string) => `/api/harbor-beacon/knowledge/preview?path=${encodeURIComponent(path)}`),
    };
  });

  it('uses snapshot polling instead of long-running MJPEG for stream-only cameras', fakeAsync(() => {
    api.cameraState = jest.fn(() => of(cameraState({
      snapshotUrl: null,
      snapshotCapability: false,
    })));
    spectator = createComponent();

    const liveUrl = spectator.component.selectedLiveUrl();

    expect(liveUrl).toContain('/api/harbor-beacon/cameras/cam-1/snapshot.jpg?ts=');
    expect(liveUrl).not.toContain('live.mjpeg');
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
      lastGoodLiveFrameUrl: { set: (value: string) => void };
      liveSnapshotErrorToken: { set: (value: number) => void };
      liveSnapshotToken: () => number;
    };
    const token = componentState.liveSnapshotToken();

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
    expect(spectator.queryAll('.recent-media-card.snapshot.pending').length).toBe(1);
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
    snapshotSubject.next({
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
    snapshotSubject.complete();
    spectator.detectChanges();

    expect(spectator.queryAll('.recent-media-card.snapshot.pending').length).toBe(0);
    expect(spectator.component.timelineItems()[0].file_path).toBe('/library/snapshots/cam-1.jpg');
    tick(3000);
    discardPeriodicTasks();
  }));

  it('opens DVR media in an inline viewer instead of a popup', fakeAsync(() => {
    const windowOpen = jest.spyOn(window, 'open').mockImplementation(() => null);
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
      timelineItems: () => Array<{ file_path: string }>;
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
    const startSubject = new Subject<HarborAssistantSearchDvrStatusResponse>();
    api.startDvrRecording = jest.fn(() => startSubject.asObservable());
    spectator = createComponent();

    spectator.component.startRecording();
    spectator.detectChanges();

    expect(spectator.query('.recording-badge')).toHaveText('Starting');

    api.dvrStatus = jest.fn(() => of(dvrStatus('recording')));
    startSubject.next(dvrStatus('recording'));
    startSubject.complete();
    spectator.detectChanges();

    expect(spectator.query('.recording-badge')).toHaveText('REC');
    tick(3000);
    discardPeriodicTasks();
  }));

  it('shows finalizing state and a pending recording card while stopping', fakeAsync(() => {
    api.dvrStatus = jest.fn(() => of(dvrStatus('recording')));
    const stopSubject = new Subject<HarborAssistantSearchDvrStatusResponse>();
    api.stopDvrRecording = jest.fn(() => stopSubject.asObservable());
    spectator = createComponent();
    spectator.detectChanges();

    spectator.component.stopRecording();
    spectator.detectChanges();

    expect(spectator.query('.recording-badge')).toHaveText('Finalizing');
    expect(spectator.queryAll('.recent-media-card.pending').length).toBeGreaterThan(0);

    stopSubject.next(dvrStatus('stopped'));
    stopSubject.complete();
    spectator.detectChanges();
    expect(spectator.query('.recording-badge')).toHaveText('Finalizing');
    tick(3000);
    discardPeriodicTasks();
  }));

  it('clears action messages while preserving action errors', fakeAsync(() => {
    spectator = createComponent();

    spectator.component.captureSnapshot();
    snapshotSubject.error({ message: 'archive failed' });
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
      ...(options.includeFixture ? [{
        device_id: 'public-fixture-dvr',
        name: 'Public DVR Fixture (not live camera)',
        snapshot_url: '/ui/assets/fixture.jpg',
        capabilities: {
          snapshot: false,
          stream: false,
          ptz: false,
        },
      }] : []),
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
