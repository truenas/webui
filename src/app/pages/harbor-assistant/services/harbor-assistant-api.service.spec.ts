import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SpectatorService, createServiceFactory } from '@ngneat/spectator/jest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { firstValueFrom } from 'rxjs';
import { HarborAssistantApiService } from './harbor-assistant-api.service';

describe('Harbor Assistant API service', () => {
  let spectator: SpectatorService<HarborAssistantApiService>;
  let httpMock: HttpTestingController;

  const createService = createServiceFactory({
    service: HarborAssistantApiService,
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

  it('uses the same-origin Harbor Assistant state endpoint', async () => {
    const promise = firstValueFrom(spectator.service.getState());

    const req = httpMock.expectOne('/api/harbor-beacon/state');
    expect(req.request.method).toBe('GET');
    req.flush({ devices: [], defaults: {} });

    const result = await promise;
    expect(result.devices).toEqual([]);
  });

  it('keeps device management actions under /api/harbor-beacon', async () => {
    const deviceId = 'cam 1/left';

    const rtspPromise = firstValueFrom(spectator.service.checkDeviceRtsp(deviceId, { reason: 'test' }));
    const rtspReq = httpMock.expectOne('/api/harbor-beacon/devices/cam%201%2Fleft/rtsp-check');
    expect(rtspReq.request.method).toBe('POST');
    rtspReq.flush({ reachable: true });
    await rtspPromise;

    const evidencePromise = firstValueFrom(spectator.service.getDeviceEvidence(deviceId));
    const evidenceReq = httpMock.expectOne('/api/harbor-beacon/devices/cam%201%2Fleft/evidence');
    expect(evidenceReq.request.method).toBe('GET');
    evidenceReq.flush({ device_id: deviceId, evidence: [] });
    await evidencePromise;

    const sharePromise = firstValueFrom(spectator.service.createCameraShareLink(deviceId));
    const shareReq = httpMock.expectOne('/api/harbor-beacon/cameras/cam%201%2Fleft/share-link');
    expect(shareReq.request.method).toBe('POST');
    shareReq.flush({});
    await sharePromise;
  });

  it('keeps camera DVR management APIs under /api/harbor-beacon', async () => {
    const settings = {
      recording_root: '/mnt/software/harborbeacon-agent-ci/camera-dvr',
      media_library_root: '/mnt/software/harborbeacon-agent-ci/camera-dvr/library',
      retention_days: 7,
      segment_seconds: 60,
      continuous_recording_enabled: true,
      low_bitrate_stream_preferred: true,
      continuous_bitrate_mbps: 2,
      high_res_event_clips_enabled: false,
      high_res_event_clip_seconds: 20,
      continuous_stream_path_hint: null,
      high_res_stream_path_hint: null,
      disk_budget_gb: 64,
      keyframe_count: 3,
      keyframe_interval_seconds: 5,
      enabled_device_ids: ['camera-main'],
    };

    const settingsPromise = firstValueFrom(spectator.service.getDvrRecordingSettings());
    const settingsReq = httpMock.expectOne('/api/harbor-beacon/cameras/recording-settings');
    expect(settingsReq.request.method).toBe('GET');
    settingsReq.flush(settings);
    expect((await settingsPromise).segment_seconds).toBe(60);

    const savePromise = firstValueFrom(spectator.service.saveDvrRecordingSettings(settings));
    const saveReq = httpMock.expectOne('/api/harbor-beacon/cameras/recording-settings');
    expect(saveReq.request.method).toBe('PUT');
    expect(saveReq.request.body.enabled_device_ids).toEqual(['camera-main']);
    saveReq.flush(settings);
    await savePromise;

    const statusPromise = firstValueFrom(spectator.service.getDvrRecordingStatus());
    const statusReq = httpMock.expectOne('/api/harbor-beacon/cameras/recordings/status');
    expect(statusReq.request.method).toBe('GET');
    statusReq.flush({ generated_at: '1', settings, capacity: {}, root_exists: true, root_writable: true, statuses: [] });
    await statusPromise;

    const timelinePromise = firstValueFrom(spectator.service.getDvrTimeline('camera-main'));
    const timelineReq = httpMock.expectOne('/api/harbor-beacon/cameras/recordings/timeline?device_id=camera-main');
    expect(timelineReq.request.method).toBe('GET');
    timelineReq.flush({
      generated_at: '1',
      recording_root: settings.recording_root,
      media_library_root: settings.media_library_root,
      segments: [],
    });
    await timelinePromise;

    const startPromise = firstValueFrom(spectator.service.startDvrRecording('camera-main'));
    const startReq = httpMock.expectOne('/api/harbor-beacon/cameras/camera-main/recordings/start');
    expect(startReq.request.method).toBe('POST');
    startReq.flush({ generated_at: '1', settings, capacity: {}, root_exists: true, root_writable: true, statuses: [] });
    await startPromise;

    const stopPromise = firstValueFrom(spectator.service.stopDvrRecording('camera-main'));
    const stopReq = httpMock.expectOne('/api/harbor-beacon/cameras/camera-main/recordings/stop');
    expect(stopReq.request.method).toBe('POST');
    stopReq.flush({ generated_at: '1', settings, capacity: {}, root_exists: true, root_writable: true, statuses: [] });
    await stopPromise;
  });

  it('keeps local vision event observability read-only under /api/harbor-beacon', async () => {
    const eventsPromise = firstValueFrom(spectator.service.getLocalVisionEvents(3));
    const eventsReq = httpMock.expectOne('/api/harbor-beacon/vision/events?limit=3');
    expect(eventsReq.request.method).toBe('GET');
    eventsReq.flush({
      generated_at: 'epoch_ms:1',
      limit: 3,
      events: [],
    });
    const response = await eventsPromise;
    expect(response.limit).toBe(3);
    expect(response.events).toEqual([]);
  });

  it('does not send credential reads or secrets to HarborGate paths', async () => {
    const promise = firstValueFrom(spectator.service.saveDeviceCredentials('cam-1', {
      username: 'admin',
      password: 'secret',
      rtsp_port: 554,
      rtsp_paths: ['/stream1'],
    }));

    const req = httpMock.expectOne('/api/harbor-beacon/devices/cam-1/credentials');
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

  it('keeps settings status APIs under /api/harbor-beacon', async () => {
    const gatewayPromise = firstValueFrom(spectator.service.getGatewayStatus());
    const gatewayReq = httpMock.expectOne('/api/harbor-beacon/gateway/status');
    expect(gatewayReq.request.method).toBe('GET');
    gatewayReq.flush({ channels: [] });
    await gatewayPromise;

    const inferencePromise = firstValueFrom(spectator.service.getInferenceHealth());
    const inferenceReq = httpMock.expectOne('/api/harbor-beacon/inference/healthz');
    expect(inferenceReq.request.method).toBe('GET');
    expect(inferenceReq.request.url).not.toContain(':4174');
    expect(inferenceReq.request.url).not.toContain(':4176');
    inferenceReq.flush({ status: 'ready', ready: true, backend: { kind: 'openai_proxy' } });
    expect((await inferencePromise).ready).toBe(true);

    const targetsPromise = firstValueFrom(spectator.service.getNotificationTargets());
    const targetsReq = httpMock.expectOne('/api/harbor-beacon/admin/notification-targets');
    expect(targetsReq.request.method).toBe('GET');
    targetsReq.flush({ targets: [] });
    await targetsPromise;

    const defaultPromise = firstValueFrom(spectator.service.setDefaultNotificationTarget('route/weixin'));
    const defaultReq = httpMock.expectOne('/api/harbor-beacon/admin/notification-targets/default');
    expect(defaultReq.request.method).toBe('POST');
    expect(defaultReq.request.body).toEqual({ target_id: 'route/weixin' });
    defaultReq.flush({ targets: [] });
    await defaultPromise;

    const deletePromise = firstValueFrom(spectator.service.deleteNotificationTarget('route/weixin'));
    const deleteReq = httpMock.expectOne('/api/harbor-beacon/admin/notification-targets/route%2Fweixin');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({});
    await deletePromise;

    const hardwarePromise = firstValueFrom(spectator.service.getHardwareReadiness());
    const hardwareReq = httpMock.expectOne('/api/harbor-beacon/hardware/readiness');
    expect(hardwareReq.request.method).toBe('GET');
    hardwareReq.flush({ status: 'ready', cpu: {}, memory: {}, gpu: {}, npu: {}, recommended_model_profile: 'cpu' });
    await hardwarePromise;

    const harborOsPromise = firstValueFrom(spectator.service.getHarborOsImCapabilityMap());
    const harborOsReq = httpMock.expectOne('/api/harbor-beacon/harboros/im-capability-map');
    expect(harborOsReq.request.method).toBe('GET');
    harborOsReq.flush({ items: [] });
    await harborOsPromise;
  });

  it('keeps Home Assistant APIs under the Harbor Assistant proxy', async () => {
    const haStatus = {
      configured: true,
      enabled: true,
      base_url: 'http://homeassistant.local:8123',
      token_configured: true,
      token_redacted: true,
      exposed_domains: ['light', 'switch'],
      status: 'connected',
      entity_count: 2,
      service_count: 3,
    };
    const installPlan = {
      app_id: 'home-assistant',
      target: 'docker',
      runtime: 'container',
      image: 'ghcr.io/home-assistant/home-assistant:stable',
      container_name: 'harbor-home-assistant',
      ports: ['8123:8123'],
      volumes: ['harbor-home-assistant-config:/config'],
      next_step: 'Create a long-lived token in Home Assistant.',
    };

    const statusPromise = firstValueFrom(spectator.service.getHomeAssistantStatus());
    const statusReq = httpMock.expectOne('/api/harbor-beacon/home-assistant/status');
    expect(statusReq.request.method).toBe('GET');
    statusReq.flush(haStatus);
    expect((await statusPromise).status).toBe('connected');

    const configPromise = firstValueFrom(spectator.service.saveHomeAssistantConfig({
      enabled: true,
      base_url: 'http://homeassistant.local:8123',
      access_token: 'secret-token',
      exposed_domains: ['light'],
    }));
    const configReq = httpMock.expectOne('/api/harbor-beacon/home-assistant/config');
    expect(configReq.request.method).toBe('PUT');
    expect(configReq.request.url).not.toContain('harborgate');
    expect(configReq.request.body.access_token).toBe('secret-token');
    configReq.flush({ status: haStatus });
    await configPromise;

    const testPromise = firstValueFrom(spectator.service.testHomeAssistantConnection());
    const testReq = httpMock.expectOne('/api/harbor-beacon/home-assistant/test');
    expect(testReq.request.method).toBe('POST');
    testReq.flush({ test: { ok: true, status: 'connected' }, status: haStatus });
    await testPromise;

    const syncPromise = firstValueFrom(spectator.service.syncHomeAssistant());
    const syncReq = httpMock.expectOne('/api/harbor-beacon/home-assistant/sync');
    expect(syncReq.request.method).toBe('POST');
    syncReq.flush({ status: haStatus, entities: [], service_domains: [] });
    await syncPromise;

    const entitiesPromise = firstValueFrom(spectator.service.getHomeAssistantEntities());
    const entitiesReq = httpMock.expectOne('/api/harbor-beacon/home-assistant/entities');
    expect(entitiesReq.request.method).toBe('GET');
    entitiesReq.flush({ entities: [] });
    await entitiesPromise;

    const servicesPromise = firstValueFrom(spectator.service.getHomeAssistantServices());
    const servicesReq = httpMock.expectOne('/api/harbor-beacon/home-assistant/services');
    expect(servicesReq.request.method).toBe('GET');
    servicesReq.flush({ services: [] });
    await servicesPromise;

    const installStatusPromise = firstValueFrom(spectator.service.getHomeAssistantInstallStatus());
    const installStatusReq = httpMock.expectOne('/api/harbor-beacon/harboros/apps/home-assistant/status');
    expect(installStatusReq.request.method).toBe('GET');
    installStatusReq.flush({
      app_id: 'home-assistant',
      status: 'not_installed',
      managed: false,
      runtime: 'container',
      container_name: null,
      onboarding_url: null,
      message: 'Home Assistant is not installed.',
    });
    await installStatusPromise;

    const installPlanPromise = firstValueFrom(spectator.service.getHomeAssistantInstallPlan());
    const installPlanReq = httpMock.expectOne('/api/harbor-beacon/harboros/apps/home-assistant/install-plan');
    expect(installPlanReq.request.method).toBe('POST');
    installPlanReq.flush(installPlan);
    await installPlanPromise;

    const installPromise = firstValueFrom(spectator.service.installHomeAssistant(false));
    const installReq = httpMock.expectOne('/api/harbor-beacon/harboros/apps/home-assistant/install');
    expect(installReq.request.method).toBe('POST');
    expect(installReq.request.body).toEqual({ dry_run: false });
    installReq.flush({
      status: 'installed',
      dry_run: false,
      plan: installPlan,
      message: 'Home Assistant container is running.',
    });
    await installPromise;
  });

  it('keeps automation review APIs under /api/harbor-beacon', async () => {
    const response = {
      generated_at: '1',
      pending_count: 1,
      reviews: [{
        review_id: 'review/1',
        workspace_id: 'local',
        source: 'harbor_assistant_chat',
        original_prompt: 'Turn on hallway lights when motion is detected.',
        status: 'pending',
      }],
    };

    const listPromise = firstValueFrom(spectator.service.getAutomationReviews());
    const listReq = httpMock.expectOne('/api/harbor-beacon/automation/reviews');
    expect(listReq.request.method).toBe('GET');
    listReq.flush(response);
    await listPromise;

    const createPromise = firstValueFrom(spectator.service.createAutomationReview({
      original_prompt: 'Turn on hallway lights when motion is detected.',
      status: 'pending',
    }));
    const createReq = httpMock.expectOne('/api/harbor-beacon/automation/reviews');
    expect(createReq.request.method).toBe('POST');
    expect(createReq.request.body.original_prompt).toContain('hallway');
    createReq.flush(response);
    await createPromise;

    const enablePromise = firstValueFrom(spectator.service.enableAutomationReview('review/1'));
    const enableReq = httpMock.expectOne('/api/harbor-beacon/automation/reviews/review%2F1/enable');
    expect(enableReq.request.method).toBe('POST');
    enableReq.flush({ ...response, pending_count: 0, reviews: [{ ...response.reviews[0], status: 'active' }] });
    await enablePromise;

    const pausePromise = firstValueFrom(spectator.service.pauseAutomationReview('review/1'));
    const pauseReq = httpMock.expectOne('/api/harbor-beacon/automation/reviews/review%2F1/pause');
    expect(pauseReq.request.method).toBe('POST');
    pauseReq.flush({ ...response, pending_count: 0, reviews: [{ ...response.reviews[0], status: 'paused' }] });
    await pausePromise;

    const discardPromise = firstValueFrom(spectator.service.discardAutomationReview('review/1'));
    const discardReq = httpMock.expectOne('/api/harbor-beacon/automation/reviews/review%2F1/discard');
    expect(discardReq.request.method).toBe('POST');
    discardReq.flush({ ...response, pending_count: 0, reviews: [{ ...response.reviews[0], status: 'discarded' }] });
    await discardPromise;
  });

  it('keeps model management APIs under /api/harbor-beacon', async () => {
    const endpointId = 'llm/local';

    const listPromise = firstValueFrom(spectator.service.getModelEndpoints());
    const listReq = httpMock.expectOne('/api/harbor-beacon/models/endpoints');
    expect(listReq.request.method).toBe('GET');
    listReq.flush({ endpoints: [] });
    await listPromise;

    const capabilitiesPromise = firstValueFrom(spectator.service.getModelCapabilities());
    const capabilitiesReq = httpMock.expectOne('/api/harbor-beacon/models/capabilities');
    expect(capabilitiesReq.request.method).toBe('GET');
    capabilitiesReq.flush({ generated_at: '1', checked_at: '1', status: 'ready', capabilities: [] });
    expect((await capabilitiesPromise).capabilities).toEqual([]);

    const runtimesPromise = firstValueFrom(spectator.service.getModelRuntimes());
    const runtimesReq = httpMock.expectOne('/api/harbor-beacon/models/runtimes');
    expect(runtimesReq.request.method).toBe('GET');
    runtimesReq.flush({ generated_at: '1', checked_at: '1', status: 'needs-runtime', runtimes: [] });
    expect((await runtimesPromise).runtimes).toEqual([]);

    const runtimeInstallPromise = firstValueFrom(spectator.service.installModelRuntime('harbor-candle'));
    const runtimeInstallReq = httpMock.expectOne('/api/harbor-beacon/models/runtimes/harbor-candle/install');
    expect(runtimeInstallReq.request.method).toBe('POST');
    runtimeInstallReq.flush({
      runtime: { runtime_id: 'harbor-candle', display_name: 'Harbor Candle Runtime', runtime_kind: 'embedded_candle', provider_key: 'harbor', status: 'installed', installed: true, active: false, next_action: 'ready' },
      runtime_manager: { generated_at: '1', checked_at: '1', status: 'installed', runtimes: [] },
      message: 'enabled',
    });
    await runtimeInstallPromise;

    const patchPromise = firstValueFrom(spectator.service.updateModelEndpoint(endpointId, {
      status: 'disabled',
      metadata: { api_key_configured: true },
    }));
    const patchReq = httpMock.expectOne('/api/harbor-beacon/models/endpoints/llm%2Flocal');
    expect(patchReq.request.method).toBe('PATCH');
    expect(patchReq.request.body.metadata.api_key_configured).toBe(true);
    patchReq.flush({ endpoints: [] });
    await patchPromise;

    const testPromise = firstValueFrom(spectator.service.testModelEndpoint(endpointId));
    const testReq = httpMock.expectOne('/api/harbor-beacon/models/endpoints/llm%2Flocal/test');
    expect(testReq.request.method).toBe('POST');
    testReq.flush({ ok: true, status: 'active', summary: 'ok' });
    await testPromise;

    const downloadPromise = firstValueFrom(spectator.service.createLocalModelDownload({
      model_id: 'qwen2.5-1.5b-instruct',
      metadata: { source_url: 'file:///tmp/model.gguf' },
    }));
    const downloadReq = httpMock.expectOne('/api/harbor-beacon/models/local-downloads');
    expect(downloadReq.request.method).toBe('POST');
    expect(downloadReq.request.body.metadata.source_url).toBe('file:///tmp/model.gguf');
    downloadReq.flush({ job: { job_id: 'job-1', model_id: 'qwen2.5-1.5b-instruct', status: 'queued' } });
    await downloadPromise;
  });

  it('keeps knowledge and file-picker APIs under /api/harbor-beacon', async () => {
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
    const settingsReq = httpMock.expectOne('/api/harbor-beacon/knowledge/settings');
    expect(settingsReq.request.method).toBe('GET');
    settingsReq.flush(settings);
    expect(await settingsPromise).toEqual(settings);

    const savePromise = firstValueFrom(spectator.service.saveKnowledgeSettings(settings));
    const saveReq = httpMock.expectOne('/api/harbor-beacon/knowledge/settings');
    expect(saveReq.request.method).toBe('PUT');
    expect(saveReq.request.body.index_root).toBe(settings.index_root);
    expect(saveReq.request.body.privacy_level).toBe('strict_local');
    expect(saveReq.request.body.default_resource_profile).toBe('cpu_only');
    saveReq.flush(settings);
    await savePromise;

    const indexPromise = firstValueFrom(spectator.service.runKnowledgeIndex());
    const indexReq = httpMock.expectOne('/api/harbor-beacon/knowledge/index/run');
    expect(indexReq.request.method).toBe('POST');
    indexReq.flush({ generated_at: '1', status: 'completed', index_root: settings.index_root, root_count: 1, indexed_roots: [], errors: [] });
    await indexPromise;

    const statusPromise = firstValueFrom(spectator.service.getKnowledgeIndexStatus());
    const statusReq = httpMock.expectOne('/api/harbor-beacon/knowledge/index/status');
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
    const browseReq = httpMock.expectOne('/api/harbor-beacon/files/browse?path=%2Fmnt%2FMM-test');
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
    const defaultsReq = httpMock.expectOne('/api/harbor-beacon/defaults');
    expect(defaultsReq.request.method).toBe('POST');
    expect(defaultsReq.request.url).not.toContain('harborgate');
    defaultsReq.flush({});
    await defaultsPromise;

    const metadataPromise = firstValueFrom(spectator.service.updateDeviceMetadata('cam 1', {
      room: 'front door',
      rtsp_path: '/stream1',
    }));
    const metadataReq = httpMock.expectOne('/api/harbor-beacon/devices/cam%201');
    expect(metadataReq.request.method).toBe('PATCH');
    expect(metadataReq.request.body.room).toBe('front door');
    metadataReq.flush({ devices: [] });
    await metadataPromise;

    const deletePromise = firstValueFrom(spectator.service.deleteDevice('cam 1'));
    const deleteReq = httpMock.expectOne('/api/harbor-beacon/devices/cam%201');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({ devices: [] });
    await deletePromise;
  });

  it('keeps Beacon calls on the Harbor Assistant same-origin proxy', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/app/pages/harbor-assistant/services/harbor-assistant-api.service.ts'),
      'utf8',
    );

    expect(source).toContain('harborAssistantBeaconApiUrl');
    expect(source).toContain("this.apiUrl('/inference/healthz')");
    expect(source).not.toContain("'/api/beacon");
    expect(source).not.toContain('`/api/beacon');
    expect(source).not.toContain("'/api/harbor-beacon");
    expect(source).not.toContain('`/api/harbor-beacon');
    [':4174', ':4175', ':4176', ':4196', ':8787', '/api/turns', '/api/web/turns'].forEach((forbidden) => {
      expect(source).not.toContain(forbidden);
    });
  });

  it('does not keep the Weixin setup action visible after the connector is connected', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/app/pages/harbor-assistant/harbor-assistant.component.ts'),
      'utf8',
    );
    const template = readFileSync(
      join(process.cwd(), 'src/app/pages/harbor-assistant/harbor-assistant.component.html'),
      'utf8',
    );

    expect(source).toContain('const setupUrl = connected ? null : harborGateConnectorSetupUrl');
    expect(template).toContain('Reconnect');
    expect(template).toContain('Manage');
    expect(template).toContain('color="primary"');
  });
});
