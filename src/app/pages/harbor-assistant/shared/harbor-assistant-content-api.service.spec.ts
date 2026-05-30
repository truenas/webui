import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SpectatorService, createServiceFactory } from '@ngneat/spectator/jest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { firstValueFrom } from 'rxjs';
import { HarborAssistantContentApiService } from 'app/pages/harbor-assistant/shared/harbor-assistant-content-api.service';

describe('Harbor Assistant content API service', () => {
  let spectator: SpectatorService<HarborAssistantContentApiService>;
  let httpMock: HttpTestingController;

  const createService = createServiceFactory({
    service: HarborAssistantContentApiService,
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    httpMock = spectator.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('posts searches to the same-origin Harbor Assistant knowledge endpoint', async () => {
    const promise = firstValueFrom(spectator.service.search({
      query: '找到和春天相关的照片',
      limit: 24,
      include_documents: true,
      include_images: true,
      include_videos: true,
    }));

    const req = httpMock.expectOne('/api/beacon/knowledge/search');
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
      images: [{
        modality: 'image',
        path: '/mnt/software/photos/neutral-001.jpg',
        title: 'neutral-001.jpg',
        score: 88,
        content_source_kinds: ['vlm'],
        content_indexed: true,
        filename_match_used: false,
        content_match_used: true,
      }],
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
    const url = spectator.service.previewUrl('/mnt/software/photos/春天 01.jpg');

    expect(url).toBe('/api/beacon/knowledge/preview?path=%2Fmnt%2Fsoftware%2Fphotos%2F%E6%98%A5%E5%A4%A9%2001.jpg');
    expect(url).not.toContain(':4174');
    expect(url).not.toContain(':8787');
  });

  it('reads camera DVR state from same-origin Harbor Assistant endpoints', async () => {
    const statePromise = firstValueFrom(spectator.service.cameraState());
    httpMock.expectOne('/api/beacon/state').flush({
      defaults: { selected_camera_device_id: 'camera-main' },
      devices: [{ device_id: 'camera-main', name: 'Front Door' }],
    });
    expect((await statePromise).devices[0].device_id).toBe('camera-main');

    const statusPromise = firstValueFrom(spectator.service.dvrStatus());
    httpMock.expectOne('/api/beacon/cameras/recordings/status').flush({
      generated_at: '1',
      statuses: [{ device_id: 'camera-main', status: 'recording' }],
    });
    expect((await statusPromise).statuses[0].status).toBe('recording');

    const timelinePromise = firstValueFrom(spectator.service.dvrTimeline('camera-main'));
    httpMock.expectOne('/api/beacon/cameras/recordings/timeline?device_id=camera-main').flush({
      generated_at: '1',
      recording_root: '/recordings',
      segments: [{ device_id: 'camera-main', file_path: '/recordings/camera-main.mp4' }],
    });
    expect((await timelinePromise).segments[0].file_path).toContain('camera-main');

    const filteredTimelinePromise = firstValueFrom(spectator.service.dvrTimeline('camera-main', '1714600000', '1714600300'));
    httpMock.expectOne('/api/beacon/cameras/recordings/timeline?device_id=camera-main&from=1714600000&to=1714600300').flush({
      generated_at: '1',
      recording_root: '/recordings',
      segments: [],
    });
    expect((await filteredTimelinePromise).segments).toEqual([]);

    const startPromise = firstValueFrom(spectator.service.startDvrRecording('camera-main'));
    httpMock.expectOne('/api/beacon/cameras/camera-main/recordings/start').flush({
      generated_at: '2',
      statuses: [{ device_id: 'camera-main', status: 'recording' }],
    });
    expect((await startPromise).statuses[0].status).toBe('recording');

    const stopPromise = firstValueFrom(spectator.service.stopDvrRecording('camera-main'));
    httpMock.expectOne('/api/beacon/cameras/camera-main/recordings/stop').flush({
      generated_at: '3',
      statuses: [{ device_id: 'camera-main', status: 'stopped' }],
    });
    expect((await stopPromise).statuses[0].status).toBe('stopped');

    const snapshotPromise = firstValueFrom(spectator.service.createSnapshotTask('camera-main'));
    httpMock.expectOne('/api/beacon/cameras/camera-main/snapshot').flush({ task_id: 'task-1' });
    expect(await snapshotPromise).toEqual({ task_id: 'task-1' });
  });

  it('uses same-origin Harbor Assistant proxy paths and avoids direct service ports', () => {
    const sources = [
      'src/app/pages/harbor-assistant/shared/harbor-assistant-content-api.service.ts',
      'src/app/pages/harbor-assistant/shared/harbor-assistant-results.ts',
      'src/app/pages/harbor-assistant/search/harbor-assistant-search.component.ts',
      'src/app/pages/harbor-assistant/camera/harbor-assistant-camera.component.ts',
    ].map((path) => readFileSync(join(process.cwd(), path), 'utf8')).join('\n');

    expect(sources).toContain('/api/beacon/knowledge/search');
    expect(sources).toContain('/api/beacon/knowledge/preview');
    expect(sources).toContain('/api/beacon/cameras/recordings/status');
    expect(sources).toContain('/api/beacon/cameras/${encodeURIComponent(deviceId)}/recordings/start');
    expect(sources).toContain('/api/beacon/cameras/${encodeURIComponent(deviceId)}/snapshot');
    [':4174', ':4175', ':4176', ':4196', ':8787', '/api/turns', '/api/web/turns'].forEach((forbidden) => {
      expect(sources).not.toContain(forbidden);
    });
  });
});
