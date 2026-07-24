import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { SpectatorService, createServiceFactory } from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { HarborAssistantContentApiService } from 'app/pages/harbor-assistant/shared/harbor-assistant-content-api.service';

describe('Harbor Assistant content API service', () => {
  let spectator: SpectatorService<HarborAssistantContentApiService>;
  let httpMock: HttpTestingController;

  const createService = createServiceFactory({
    service: HarborAssistantContentApiService,
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });

  beforeEach(() => {
    spectator = createService();
    httpMock = spectator.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('posts searches to the same-origin Harbor Assistant knowledge endpoint', async () => {
    const promise = firstValueFrom(
      spectator.service.search({
        query: '找到和春天相关的照片',
        limit: 24,
        include_documents: true,
        include_images: true,
        include_videos: true,
      }),
    );

    const req = httpMock.expectOne('/api/harbor-beacon/knowledge/search');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      query: '找到和春天相关的照片',
      limit: 24,
      include_documents: true,
      include_images: true,
      include_videos: true,
    });
    expect(req.request.url).not.toContain(':4174');
    req.flush({
      query: '找到和春天相关的照片',
      roots: [],
      total_matches: 1,
      documents: [],
      images: [
        {
          modality: 'image',
          path: '/mnt/software/photos/neutral-001.jpg',
          title: 'neutral-001.jpg',
          score: 88,
          content_source_kinds: ['vlm'],
          content_indexed: true,
          filename_match_used: false,
          content_match_used: true,
        },
      ],
      videos: [],
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
    });

    const response = await promise;
    expect(response.images[0].content_source_kinds).toEqual(['vlm']);
    expect(response.images[0].filename_match_used).toBe(false);
    expect(response.images[0].content_match_used).toBe(true);
  });

  it('builds encoded same-origin preview URLs', () => {
    const url = spectator.service.previewUrl(
      '/mnt/software/photos/春天 01.jpg',
    );

    expect(url).toBe(
      '/api/harbor-beacon/knowledge/preview?path=%2Fmnt%2Fsoftware%2Fphotos%2F%E6%98%A5%E5%A4%A9%2001.jpg',
    );
    expect(url).not.toContain(':4174');
    expect(url).not.toContain(':8787');
  });

  it('reads camera DVR state from same-origin Harbor Assistant endpoints', async () => {
    const statePromise = firstValueFrom(spectator.service.cameraState());
    httpMock.expectOne('/api/harbor-beacon/state').flush({
      defaults: { selected_camera_device_id: 'camera-main' },
      devices: [{ device_id: 'camera-main', name: 'Front Door' }],
    });
    expect((await statePromise).devices[0].device_id).toBe('camera-main');

    const statusPromise = firstValueFrom(spectator.service.dvrStatus());
    httpMock.expectOne('/api/harbor-beacon/cameras/recordings/status').flush({
      generated_at: '1',
      statuses: [{ device_id: 'camera-main', status: 'recording' }],
    });
    expect((await statusPromise).statuses[0].status).toBe('recording');

    const timelinePromise = firstValueFrom(
      spectator.service.dvrTimeline('camera-main'),
    );
    httpMock
      .expectOne(
        '/api/harbor-beacon/cameras/recordings/timeline?device_id=camera-main',
      )
      .flush({
        generated_at: '1',
        recording_root: '/recordings',
        segments: [
          {
            device_id: 'camera-main',
            file_path: '/recordings/camera-main.mp4',
          },
        ],
      });
    expect((await timelinePromise).segments[0].file_path).toContain(
      'camera-main',
    );

    const filteredTimelinePromise = firstValueFrom(
      spectator.service.dvrTimeline('camera-main', '1714600000', '1714600300'),
    );
    httpMock
      .expectOne(
        '/api/harbor-beacon/cameras/recordings/timeline?device_id=camera-main&from=1714600000&to=1714600300',
      )
      .flush({
        generated_at: '1',
        recording_root: '/recordings',
        segments: [],
      });
    expect((await filteredTimelinePromise).segments).toEqual([]);

    const startPromise = firstValueFrom(
      spectator.service.startDvrRecording('camera-main', 'main'),
    );
    const startReq = httpMock.expectOne(
      '/api/harbor-beacon/cameras/camera-main/recordings/start',
    );
    expect(startReq.request.method).toBe('POST');
    expect(startReq.request.body).toEqual({ stream_profile: 'main' });
    startReq.flush({
      generated_at: '2',
      statuses: [{ device_id: 'camera-main', status: 'recording' }],
    });
    expect((await startPromise).statuses[0].status).toBe('recording');

    const stopPromise = firstValueFrom(
      spectator.service.stopDvrRecording('camera-main'),
    );
    httpMock
      .expectOne('/api/harbor-beacon/cameras/camera-main/recordings/stop')
      .flush({
        generated_at: '3',
        statuses: [{ device_id: 'camera-main', status: 'stopped' }],
      });
    expect((await stopPromise).statuses[0].status).toBe('stopped');

    const livePromise = firstValueFrom(
      spectator.service.startCameraLiveSession('camera-main', 'main'),
    );
    const liveReq = httpMock.expectOne(
      '/api/harbor-beacon/cameras/camera-main/live/start',
    );
    expect(liveReq.request.method).toBe('POST');
    expect(liveReq.request.body).toEqual({ stream_profile: 'main' });
    const liveStartRequestId = liveReq.request.headers.get('X-Request-Id');
    expect(liveStartRequestId).toMatch(/^webui:live-start:camera-main:/);
    liveReq.flush({
      device_id: 'camera-main',
      session_id: 'live-main',
      status: 'running',
      playlist_ready: true,
      mode: 'hls_fmp4',
      codec: 'h264_low_latency',
      stream_profile: 'main',
      updated_at: '4',
    });
    expect((await livePromise).stream_profile).toBe('main');

    const renewPromise = firstValueFrom(
      spectator.service.renewCameraLiveSession('camera-main', 'live-main', 300),
    );
    const renewReq = httpMock.expectOne(
      '/api/harbor-beacon/cameras/camera-main/live/renew',
    );
    expect(renewReq.request.method).toBe('POST');
    expect(renewReq.request.body).toEqual({
      session_id: 'live-main',
      ttl_seconds: 300,
    });
    const liveRenewRequestId = renewReq.request.headers.get('X-Request-Id');
    expect(liveRenewRequestId).toMatch(/^webui:live-renew:camera-main:live-main:/);
    expect(liveRenewRequestId).not.toBe(liveStartRequestId);
    renewReq.flush({
      device_id: 'camera-main',
      session_id: 'live-main',
      status: 'running',
      playlist_ready: true,
      mode: 'harborlink_media',
      codec: 'h264',
      stream_profile: 'main',
      updated_at: '5',
    });
    expect((await renewPromise).session_id).toBe('live-main');

    const snapshotPromise = firstValueFrom(
      spectator.service.createSnapshotTask('camera-main'),
    );
    httpMock
      .expectOne('/api/harbor-beacon/cameras/camera-main/snapshot')
      .flush({ task_id: 'task-1' });
    expect(await snapshotPromise).toEqual({ task_id: 'task-1' });
  });

  it('keeps the business request ID stable when a mutation request is resubscribed', async () => {
    const stopRequest$ = spectator.service.stopCameraLiveSession('camera-main', 'live-main');
    const response = {
      device_id: 'camera-main',
      session_id: 'live-main',
      status: 'stopped',
      playlist_ready: false,
      mode: 'harborlink_media',
      codec: 'h264',
      stream_profile: 'main',
      updated_at: '6',
    };

    const firstPromise = firstValueFrom(stopRequest$);
    const firstRequest = httpMock.expectOne('/api/harbor-beacon/cameras/camera-main/live/stop');
    const firstRequestId = firstRequest.request.headers.get('X-Request-Id');
    firstRequest.flush(response);
    await firstPromise;

    const secondPromise = firstValueFrom(stopRequest$);
    const secondRequest = httpMock.expectOne('/api/harbor-beacon/cameras/camera-main/live/stop');
    expect(secondRequest.request.headers.get('X-Request-Id')).toBe(firstRequestId);
    secondRequest.flush(response);
    await secondPromise;
  });

  it('uses same-origin Harbor Assistant proxy paths and avoids direct service ports', () => {
    const sources = [
      'src/app/pages/harbor-assistant/shared/harbor-assistant-content-api.service.ts',
      'src/app/pages/harbor-assistant/shared/harbor-assistant-results.ts',
      'src/app/pages/harbor-assistant/search/harbor-assistant-search.component.ts',
      'src/app/pages/harbor-assistant/camera/harbor-assistant-camera.component.ts',
    ]
      .map((path) => readFileSync(join(process.cwd(), path), 'utf8'))
      .join('\n');

    expect(sources).toContain('harborAssistantBeaconApiUrl');
    expect(sources).toContain("this.apiUrl('/knowledge/search')");
    expect(sources).toContain(
      'harborAssistantBeaconApiUrl(`/knowledge/preview',
    );
    expect(sources).toContain("this.apiUrl('/cameras/recordings/status')");
    expect(sources).toContain(
      ['this.apiUrl(`/cameras/$', '{encodeURIComponent(deviceId)}/recordings/start`)'].join(''),
    );
    expect(sources).toContain(
      ['this.apiUrl(`/cameras/$', '{encodeURIComponent(deviceId)}/snapshot`)'].join(''),
    );
    expect(sources).not.toContain('/api/harbor-assistant');
    [
      ':4174',
      ':4175',
      ':4176',
      ':4196',
      ':8787',
      '/api/turns',
      '/api/web/turns',
    ].forEach((forbidden) => {
      expect(sources).not.toContain(forbidden);
    });
  });
});
