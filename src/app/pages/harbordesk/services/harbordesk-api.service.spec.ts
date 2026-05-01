import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SpectatorService, createServiceFactory } from '@ngneat/spectator/jest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { firstValueFrom } from 'rxjs';
import { HarborDeskApiService } from './harbordesk-api.service';

describe('HarborDeskApiService', () => {
  let spectator: SpectatorService<HarborDeskApiService>;
  let httpMock: HttpTestingController;

  const createService = createServiceFactory({
    service: HarborDeskApiService,
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

  it('uses the same-origin HarborDesk state endpoint', async () => {
    const promise = firstValueFrom(spectator.service.getState());

    const req = httpMock.expectOne('/api/harbordesk/state');
    expect(req.request.method).toBe('GET');
    req.flush({ devices: [], defaults: {} });

    const result = await promise;
    expect(result.devices).toEqual([]);
  });

  it('keeps device management actions under /api/harbordesk', async () => {
    const deviceId = 'cam 1/left';

    const rtspPromise = firstValueFrom(spectator.service.checkDeviceRtsp(deviceId, { reason: 'test' }));
    const rtspReq = httpMock.expectOne('/api/harbordesk/devices/cam%201%2Fleft/rtsp-check');
    expect(rtspReq.request.method).toBe('POST');
    rtspReq.flush({ reachable: true });
    await rtspPromise;

    const evidencePromise = firstValueFrom(spectator.service.getDeviceEvidence(deviceId));
    const evidenceReq = httpMock.expectOne('/api/harbordesk/devices/cam%201%2Fleft/evidence');
    expect(evidenceReq.request.method).toBe('GET');
    evidenceReq.flush({ device_id: deviceId, evidence: [] });
    await evidencePromise;

    const sharePromise = firstValueFrom(spectator.service.createCameraShareLink(deviceId));
    const shareReq = httpMock.expectOne('/api/harbordesk/cameras/cam%201%2Fleft/share-link');
    expect(shareReq.request.method).toBe('POST');
    shareReq.flush({});
    await sharePromise;
  });

  it('does not send credential reads or secrets to HarborGate paths', async () => {
    const promise = firstValueFrom(spectator.service.saveDeviceCredentials('cam-1', {
      username: 'admin',
      password: 'secret',
      rtsp_port: 554,
      rtsp_paths: ['/stream1'],
    }));

    const req = httpMock.expectOne('/api/harbordesk/devices/cam-1/credentials');
    expect(req.request.method).toBe('POST');
    expect(req.request.url).not.toContain('harborgate');
    expect(req.request.body).toEqual({
      username: 'admin',
      password: 'secret',
      rtsp_port: 554,
      rtsp_paths: ['/stream1'],
    });
    req.flush({ device_id: 'cam-1', configured: true, status: 'configured', redacted: true });

    const result = await promise;
    expect(result.configured).toBe(true);
  });

  it('keeps settings status APIs under /api/harbordesk', async () => {
    const gatewayPromise = firstValueFrom(spectator.service.getGatewayStatus());
    const gatewayReq = httpMock.expectOne('/api/harbordesk/gateway/status');
    expect(gatewayReq.request.method).toBe('GET');
    gatewayReq.flush({ channels: [] });
    await gatewayPromise;

    const inferencePromise = firstValueFrom(spectator.service.getInferenceHealth());
    const inferenceReq = httpMock.expectOne('/api/harbordesk/inference/healthz');
    expect(inferenceReq.request.method).toBe('GET');
    expect(inferenceReq.request.url).not.toContain(':4174');
    expect(inferenceReq.request.url).not.toContain(':4176');
    inferenceReq.flush({ status: 'ready', ready: true, backend: { kind: 'openai_proxy' } });
    expect((await inferencePromise).ready).toBe(true);

    const targetsPromise = firstValueFrom(spectator.service.getNotificationTargets());
    const targetsReq = httpMock.expectOne('/api/harbordesk/admin/notification-targets');
    expect(targetsReq.request.method).toBe('GET');
    targetsReq.flush({ targets: [] });
    await targetsPromise;

    const defaultPromise = firstValueFrom(spectator.service.setDefaultNotificationTarget('route/weixin'));
    const defaultReq = httpMock.expectOne('/api/harbordesk/admin/notification-targets/default');
    expect(defaultReq.request.method).toBe('POST');
    expect(defaultReq.request.body).toEqual({ target_id: 'route/weixin' });
    defaultReq.flush({ targets: [] });
    await defaultPromise;

    const deletePromise = firstValueFrom(spectator.service.deleteNotificationTarget('route/weixin'));
    const deleteReq = httpMock.expectOne('/api/harbordesk/admin/notification-targets/route%2Fweixin');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({});
    await deletePromise;

    const hardwarePromise = firstValueFrom(spectator.service.getHardwareReadiness());
    const hardwareReq = httpMock.expectOne('/api/harbordesk/hardware/readiness');
    expect(hardwareReq.request.method).toBe('GET');
    hardwareReq.flush({ status: 'ready', cpu: {}, memory: {}, gpu: {}, npu: {}, recommended_model_profile: 'cpu' });
    await hardwarePromise;

    const harborOsPromise = firstValueFrom(spectator.service.getHarborOsImCapabilityMap());
    const harborOsReq = httpMock.expectOne('/api/harbordesk/harboros/im-capability-map');
    expect(harborOsReq.request.method).toBe('GET');
    harborOsReq.flush({ items: [] });
    await harborOsPromise;
  });

  it('keeps model management APIs under /api/harbordesk', async () => {
    const endpointId = 'llm/local';

    const listPromise = firstValueFrom(spectator.service.getModelEndpoints());
    const listReq = httpMock.expectOne('/api/harbordesk/models/endpoints');
    expect(listReq.request.method).toBe('GET');
    listReq.flush({ endpoints: [] });
    await listPromise;

    const patchPromise = firstValueFrom(spectator.service.updateModelEndpoint(endpointId, {
      status: 'disabled',
      metadata: { api_key_configured: true },
    }));
    const patchReq = httpMock.expectOne('/api/harbordesk/models/endpoints/llm%2Flocal');
    expect(patchReq.request.method).toBe('PATCH');
    expect(patchReq.request.body.metadata.api_key_configured).toBe(true);
    patchReq.flush({ endpoints: [] });
    await patchPromise;

    const testPromise = firstValueFrom(spectator.service.testModelEndpoint(endpointId));
    const testReq = httpMock.expectOne('/api/harbordesk/models/endpoints/llm%2Flocal/test');
    expect(testReq.request.method).toBe('POST');
    testReq.flush({ ok: true, status: 'active', summary: 'ok' });
    await testPromise;

    const downloadPromise = firstValueFrom(spectator.service.createLocalModelDownload({
      model_id: 'qwen2.5-1.5b-instruct',
      metadata: { source_url: 'file:///tmp/model.gguf' },
    }));
    const downloadReq = httpMock.expectOne('/api/harbordesk/models/local-downloads');
    expect(downloadReq.request.method).toBe('POST');
    expect(downloadReq.request.body.metadata.source_url).toBe('file:///tmp/model.gguf');
    downloadReq.flush({ job: { job_id: 'job-1', model_id: 'qwen2.5-1.5b-instruct', status: 'queued' } });
    await downloadPromise;
  });

  it('keeps knowledge and file-picker APIs under /api/harbordesk', async () => {
    const settings = {
      source_roots: [{
        root_id: 'mm-test',
        label: 'MM test',
        path: '/mnt/MM-test',
        enabled: true,
        include: [],
        exclude: [],
        last_indexed_at: null,
      }],
      index_root: '/mnt/software/harborbeacon-agent-ci/knowledge-index',
      privacy_level: 'strict_local',
      default_resource_profile: 'cpu_only',
    };

    const settingsPromise = firstValueFrom(spectator.service.getKnowledgeSettings());
    const settingsReq = httpMock.expectOne('/api/harbordesk/knowledge/settings');
    expect(settingsReq.request.method).toBe('GET');
    settingsReq.flush(settings);
    expect(await settingsPromise).toEqual(settings);

    const savePromise = firstValueFrom(spectator.service.saveKnowledgeSettings(settings));
    const saveReq = httpMock.expectOne('/api/harbordesk/knowledge/settings');
    expect(saveReq.request.method).toBe('PUT');
    expect(saveReq.request.body.index_root).toBe(settings.index_root);
    expect(saveReq.request.body.privacy_level).toBe('strict_local');
    expect(saveReq.request.body.default_resource_profile).toBe('cpu_only');
    saveReq.flush(settings);
    await savePromise;

    const indexPromise = firstValueFrom(spectator.service.runKnowledgeIndex());
    const indexReq = httpMock.expectOne('/api/harbordesk/knowledge/index/run');
    expect(indexReq.request.method).toBe('POST');
    indexReq.flush({ generated_at: '1', status: 'completed', index_root: settings.index_root, root_count: 1, indexed_roots: [], errors: [] });
    await indexPromise;

    const statusPromise = firstValueFrom(spectator.service.getKnowledgeIndexStatus());
    const statusReq = httpMock.expectOne('/api/harbordesk/knowledge/index/status');
    expect(statusReq.request.method).toBe('GET');
    statusReq.flush({
      generated_at: '1',
      status: 'ready',
      settings,
      index_root_exists: true,
      index_root_writable: true,
      image_count: 12,
      content_indexed_image_count: 9,
      vlm_indexed_image_count: 7,
      source_roots: [],
      blockers: [],
    });
    const status = await statusPromise;
    expect(status.image_count).toBe(12);
    expect(status.content_indexed_image_count).toBe(9);
    expect(status.vlm_indexed_image_count).toBe(7);

    const browsePromise = firstValueFrom(spectator.service.browseFiles('/mnt/MM-test'));
    const browseReq = httpMock.expectOne('/api/harbordesk/files/browse?path=%2Fmnt%2FMM-test');
    expect(browseReq.request.method).toBe('GET');
    browseReq.flush({ path: '/mnt/MM-test', parent: '/mnt', readonly: true, allowed_roots: ['/mnt'], entries: [] });
    await browsePromise;
  });

  it('keeps defaults and metadata management in HarborBeacon AIoT paths', async () => {
    const defaultsPromise = firstValueFrom(spectator.service.saveDefaults({
      cidr: '192.168.3.0/24',
      discovery: 'ONVIF + RTSP',
      recording: 'event',
      capture: 'snapshot',
      ai: 'summary',
      notification_channel: 'home',
      rtsp_username: 'admin',
      rtsp_password: '',
      rtsp_port: 554,
      rtsp_paths: ['/stream1'],
      selected_camera_device_id: 'cam-1',
      capture_subdirectory: 'captures',
      clip_length_seconds: 30,
      keyframe_count: 3,
      keyframe_interval_seconds: 5,
    }));
    const defaultsReq = httpMock.expectOne('/api/harbordesk/defaults');
    expect(defaultsReq.request.method).toBe('POST');
    expect(defaultsReq.request.url).not.toContain('harborgate');
    defaultsReq.flush({});
    await defaultsPromise;

    const metadataPromise = firstValueFrom(spectator.service.updateDeviceMetadata('cam 1', {
      room: 'front door',
      rtsp_path: '/stream1',
    }));
    const metadataReq = httpMock.expectOne('/api/harbordesk/devices/cam%201');
    expect(metadataReq.request.method).toBe('PATCH');
    expect(metadataReq.request.body.room).toBe('front door');
    metadataReq.flush({ devices: [] });
    await metadataPromise;
  });

  it('keeps Beacon calls on the HarborDesk same-origin proxy', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/app/pages/harbordesk/services/harbordesk-api.service.ts'),
      'utf8',
    );

    const literalApiUrls = Array.from(source.matchAll(/['`]([^'`]*\/api\/[^'`]*)['`]/g))
      .map((match) => match[1])
      .filter((url) => !url.startsWith('app/'));

    expect(literalApiUrls.length).toBeGreaterThan(0);
    literalApiUrls.forEach((url) => expect(url).toContain('/api/harbordesk'));
    expect(source).toContain('/api/harbordesk/inference/healthz');
    [':4174', ':4175', ':4176', ':4196', ':8787', '/api/turns', '/api/web/turns'].forEach((forbidden) => {
      expect(source).not.toContain(forbidden);
    });
  });

  it('does not keep the Weixin setup action visible after the connector is connected', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/app/pages/harbordesk/harbordesk.component.ts'),
      'utf8',
    );
    const template = readFileSync(
      join(process.cwd(), 'src/app/pages/harbordesk/harbordesk.component.html'),
      'utf8',
    );

    expect(source).toContain('const setupUrl = connected ? null : harborGateConnectorSetupUrl');
    expect(template).toContain('Open manage');
    expect(template).toContain('color="primary"');
  });
});
