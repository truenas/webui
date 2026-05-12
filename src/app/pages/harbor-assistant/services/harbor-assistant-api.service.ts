import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  AdminDefaultsPayload,
  AdminStateResponse,
  DeviceCredentialStatus,
  DeviceCredentialsPayload,
  DeviceEvidenceResponse,
  DeviceMetadataPatchPayload,
  DiscoveryScanResponse,
  DeviceValidationRunRequest,
  DeviceValidationRunResponse,
  DiscoveryScanPayload,
  DvrRecordingSettings,
  DvrRecordingStatusResponse,
  DvrTimelineResponse,
  FilesBrowseResponse,
  GatewayStatusResponse,
  HarborAssistantBackendStatus,
  HomeAssistantConfigPayload,
  HomeAssistantConfigResponse,
  HomeAssistantEntitiesResponse,
  HomeAssistantInstallPlanResponse,
  HomeAssistantInstallResponse,
  HomeAssistantInstallStatusResponse,
  HomeAssistantServicesResponse,
  HomeAssistantStatusResponse,
  HomeAssistantSyncResponse,
  HomeAssistantTestResponse,
  HarborOsImCapabilityMapResponse,
  HarborOsStatusResponse,
  HardwareReadinessResponse,
  InferenceHealthResponse,
  KnowledgeIndexRunResponse,
  KnowledgeIndexStatusResponse,
  KnowledgeSettings,
  LocalModelCatalogResponse,
  LocalModelDownloadJobResponse,
  LocalModelDownloadsResponse,
  ManualDevicePayload,
  ModelCapabilitiesResponse,
  ModelDownloadRequest,
  ModelStoreStatusResponse,
  ModelEndpointPayload,
  ModelEndpointsResponse,
  ModelEndpointTestResult,
  ModelPoliciesResponse,
  NotificationTargetsResponse,
  RagReadinessResponse,
  RtspCheckPayload,
  RtspCheckResult,
  ShareLinkSummary,
} from 'app/pages/harbor-assistant/interfaces/harbor-assistant-status.interface';

@Injectable({
  providedIn: 'root',
})
export class HarborAssistantApiService {
  private http = inject(HttpClient);

  private apiUrl(path: string): string {
    return `/api/harbor-assistant${path}`;
  }

  getState(): Observable<AdminStateResponse> {
    return this.http.get<AdminStateResponse>('/api/harbor-assistant/state');
  }

  getBackendStatus(): Observable<HarborAssistantBackendStatus> {
    return this.http.get<Record<string, unknown>>('/api/harbor-assistant/state').pipe(
      map((state): HarborAssistantBackendStatus => ({
        connected: true,
        summary: this.readString(state, 'status')
          ?? this.readString(state, 'health')
          ?? T('HarborBeacon admin API is reachable.'),
        generatedAt: this.readString(state, 'generated_at')
          ?? this.readString(state, 'generatedAt')
          ?? null,
        error: null,
      })),
      catchError((error: unknown) => of({
        connected: false,
        summary: T('HarborBeacon admin API is not reachable through the Harbor Assistant proxy.'),
        generatedAt: null,
        error: this.getErrorMessage(error),
      })),
    );
  }

  getGatewayStatus(): Observable<GatewayStatusResponse> {
    return this.http.get<GatewayStatusResponse>('/api/harbor-assistant/gateway/status');
  }

  getInferenceHealth(): Observable<InferenceHealthResponse> {
    return this.http.get<InferenceHealthResponse>('/api/harbor-assistant/inference/healthz');
  }

  getNotificationTargets(): Observable<NotificationTargetsResponse> {
    return this.http.get<NotificationTargetsResponse>('/api/harbor-assistant/admin/notification-targets');
  }

  setDefaultNotificationTarget(targetId: string): Observable<NotificationTargetsResponse> {
    return this.http.post<NotificationTargetsResponse>('/api/harbor-assistant/admin/notification-targets/default', {
      target_id: targetId,
    });
  }

  deleteNotificationTarget(targetId: string): Observable<void> {
    return this.http.delete<void>(`/api/harbor-assistant/admin/notification-targets/${encodeURIComponent(targetId)}`);
  }

  getHardwareReadiness(): Observable<HardwareReadinessResponse> {
    return this.http.get<HardwareReadinessResponse>('/api/harbor-assistant/hardware/readiness');
  }

  getRagReadiness(): Observable<RagReadinessResponse> {
    return this.http.get<RagReadinessResponse>('/api/harbor-assistant/rag/readiness');
  }

  getKnowledgeSettings(): Observable<KnowledgeSettings> {
    return this.http.get<KnowledgeSettings>('/api/harbor-assistant/knowledge/settings');
  }

  saveKnowledgeSettings(payload: KnowledgeSettings): Observable<KnowledgeSettings> {
    return this.http.put<KnowledgeSettings>('/api/harbor-assistant/knowledge/settings', payload);
  }

  runKnowledgeIndex(): Observable<KnowledgeIndexRunResponse> {
    return this.http.post<KnowledgeIndexRunResponse>('/api/harbor-assistant/knowledge/index/run', {});
  }

  getKnowledgeIndexStatus(): Observable<KnowledgeIndexStatusResponse> {
    return this.http.get<KnowledgeIndexStatusResponse>('/api/harbor-assistant/knowledge/index/status');
  }

  browseFiles(path?: string | null): Observable<FilesBrowseResponse> {
    const query = path ? `?path=${encodeURIComponent(path)}` : '';
    return this.http.get<FilesBrowseResponse>(`/api/harbor-assistant/files/browse${query}`);
  }

  getHarborOsStatus(): Observable<HarborOsStatusResponse> {
    return this.http.get<HarborOsStatusResponse>('/api/harbor-assistant/harboros/status');
  }

  getHarborOsImCapabilityMap(): Observable<HarborOsImCapabilityMapResponse> {
    return this.http.get<HarborOsImCapabilityMapResponse>('/api/harbor-assistant/harboros/im-capability-map');
  }

  getHomeAssistantStatus(): Observable<HomeAssistantStatusResponse> {
    return this.http.get<HomeAssistantStatusResponse>(this.apiUrl('/home-assistant/status'));
  }

  saveHomeAssistantConfig(payload: HomeAssistantConfigPayload): Observable<HomeAssistantConfigResponse> {
    return this.http.put<HomeAssistantConfigResponse>(this.apiUrl('/home-assistant/config'), payload);
  }

  testHomeAssistantConnection(): Observable<HomeAssistantTestResponse> {
    return this.http.post<HomeAssistantTestResponse>(this.apiUrl('/home-assistant/test'), {});
  }

  syncHomeAssistant(): Observable<HomeAssistantSyncResponse> {
    return this.http.post<HomeAssistantSyncResponse>(this.apiUrl('/home-assistant/sync'), {});
  }

  getHomeAssistantEntities(): Observable<HomeAssistantEntitiesResponse> {
    return this.http.get<HomeAssistantEntitiesResponse>(this.apiUrl('/home-assistant/entities'));
  }

  getHomeAssistantServices(): Observable<HomeAssistantServicesResponse> {
    return this.http.get<HomeAssistantServicesResponse>(this.apiUrl('/home-assistant/services'));
  }

  getHomeAssistantInstallStatus(): Observable<HomeAssistantInstallStatusResponse> {
    return this.http.get<HomeAssistantInstallStatusResponse>(this.apiUrl('/harboros/apps/home-assistant/status'));
  }

  getHomeAssistantInstallPlan(): Observable<HomeAssistantInstallPlanResponse> {
    return this.http.post<HomeAssistantInstallPlanResponse>(this.apiUrl('/harboros/apps/home-assistant/install-plan'), {});
  }

  installHomeAssistant(dryRun = false): Observable<HomeAssistantInstallResponse> {
    return this.http.post<HomeAssistantInstallResponse>(this.apiUrl('/harboros/apps/home-assistant/install'), {
      dry_run: dryRun,
    });
  }

  getModelEndpoints(): Observable<ModelEndpointsResponse> {
    return this.http.get<ModelEndpointsResponse>('/api/harbor-assistant/models/endpoints');
  }

  getModelCapabilities(): Observable<ModelCapabilitiesResponse> {
    return this.http.get<ModelCapabilitiesResponse>('/api/harbor-assistant/models/capabilities');
  }

  updateModelStore(path: string): Observable<ModelStoreStatusResponse> {
    return this.http.put<ModelStoreStatusResponse>('/api/harbor-assistant/models/store', { path });
  }

  selectModelCapability(capabilityId: string, modelId: string): Observable<ModelCapabilitiesResponse> {
    return this.http.post<ModelCapabilitiesResponse>(
      `/api/harbor-assistant/models/capabilities/${encodeURIComponent(capabilityId)}/selection`,
      { model_id: modelId },
    );
  }

  createModelEndpoint(payload: ModelEndpointPayload): Observable<ModelEndpointsResponse> {
    return this.http.post<ModelEndpointsResponse>('/api/harbor-assistant/models/endpoints', payload);
  }

  updateModelEndpoint(modelEndpointId: string, payload: Partial<ModelEndpointPayload>): Observable<ModelEndpointsResponse> {
    return this.http.patch<ModelEndpointsResponse>(
      `/api/harbor-assistant/models/endpoints/${encodeURIComponent(modelEndpointId)}`,
      payload,
    );
  }

  testModelEndpoint(modelEndpointId: string): Observable<ModelEndpointTestResult> {
    return this.http.post<ModelEndpointTestResult>(
      `/api/harbor-assistant/models/endpoints/${encodeURIComponent(modelEndpointId)}/test`,
      {},
    );
  }

  getModelPolicies(): Observable<ModelPoliciesResponse> {
    return this.http.get<ModelPoliciesResponse>('/api/harbor-assistant/models/policies');
  }

  saveModelPolicies(payload: ModelPoliciesResponse): Observable<ModelPoliciesResponse> {
    return this.http.put<ModelPoliciesResponse>('/api/harbor-assistant/models/policies', payload);
  }

  getLocalModelCatalog(): Observable<LocalModelCatalogResponse> {
    return this.http.get<LocalModelCatalogResponse>('/api/harbor-assistant/models/local-catalog');
  }

  getLocalModelDownloads(): Observable<LocalModelDownloadsResponse> {
    return this.http.get<LocalModelDownloadsResponse>('/api/harbor-assistant/models/local-downloads');
  }

  createLocalModelDownload(payload: ModelDownloadRequest): Observable<LocalModelDownloadJobResponse> {
    return this.http.post<LocalModelDownloadJobResponse>('/api/harbor-assistant/models/local-downloads', payload);
  }

  cancelLocalModelDownload(jobId: string): Observable<LocalModelDownloadJobResponse> {
    return this.http.post<LocalModelDownloadJobResponse>(
      `/api/harbor-assistant/models/local-downloads/${encodeURIComponent(jobId)}/cancel`,
      {},
    );
  }

  scanDevices(payload: DiscoveryScanPayload): Observable<DiscoveryScanResponse> {
    return this.http.post<DiscoveryScanResponse>('/api/harbor-assistant/discovery/scan', payload);
  }

  addManualDevice(payload: ManualDevicePayload): Observable<unknown> {
    return this.http.post<unknown>('/api/harbor-assistant/devices/manual', payload);
  }

  setDefaultCamera(deviceId: string | null): Observable<AdminStateResponse> {
    return this.http.post<AdminStateResponse>('/api/harbor-assistant/devices/default-camera', {
      device_id: deviceId,
    });
  }

  updateDeviceMetadata(deviceId: string, payload: DeviceMetadataPatchPayload): Observable<AdminStateResponse> {
    return this.http.patch<AdminStateResponse>(
      `/api/harbor-assistant/devices/${encodeURIComponent(deviceId)}`,
      payload,
    );
  }

  deleteDevice(deviceId: string): Observable<AdminStateResponse> {
    return this.http.delete<AdminStateResponse>(
      `/api/harbor-assistant/devices/${encodeURIComponent(deviceId)}`,
    );
  }

  saveDefaults(payload: AdminDefaultsPayload): Observable<unknown> {
    return this.http.post<unknown>('/api/harbor-assistant/defaults', payload);
  }

  saveDeviceCredentials(deviceId: string, payload: DeviceCredentialsPayload): Observable<DeviceCredentialStatus> {
    return this.http.post<DeviceCredentialStatus>(
      `/api/harbor-assistant/devices/${encodeURIComponent(deviceId)}/credentials`,
      payload,
    );
  }

  checkDeviceRtsp(deviceId: string, payload: RtspCheckPayload): Observable<RtspCheckResult> {
    return this.http.post<RtspCheckResult>(
      `/api/harbor-assistant/devices/${encodeURIComponent(deviceId)}/rtsp-check`,
      payload,
    );
  }

  getDeviceEvidence(deviceId: string): Observable<DeviceEvidenceResponse> {
    return this.http.get<DeviceEvidenceResponse>(
      `/api/harbor-assistant/devices/${encodeURIComponent(deviceId)}/evidence`,
    );
  }

  getDvrRecordingSettings(): Observable<DvrRecordingSettings> {
    return this.http.get<DvrRecordingSettings>('/api/harbor-assistant/cameras/recording-settings');
  }

  saveDvrRecordingSettings(payload: DvrRecordingSettings): Observable<DvrRecordingSettings> {
    return this.http.put<DvrRecordingSettings>('/api/harbor-assistant/cameras/recording-settings', payload);
  }

  getDvrRecordingStatus(): Observable<DvrRecordingStatusResponse> {
    return this.http.get<DvrRecordingStatusResponse>('/api/harbor-assistant/cameras/recordings/status');
  }

  getDvrTimeline(deviceId?: string | null): Observable<DvrTimelineResponse> {
    const query = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : '';
    return this.http.get<DvrTimelineResponse>(`/api/harbor-assistant/cameras/recordings/timeline${query}`);
  }

  startDvrRecording(deviceId: string): Observable<DvrRecordingStatusResponse> {
    return this.http.post<DvrRecordingStatusResponse>(
      `/api/harbor-assistant/cameras/${encodeURIComponent(deviceId)}/recordings/start`,
      {},
    );
  }

  stopDvrRecording(deviceId: string): Observable<DvrRecordingStatusResponse> {
    return this.http.post<DvrRecordingStatusResponse>(
      `/api/harbor-assistant/cameras/${encodeURIComponent(deviceId)}/recordings/stop`,
      {},
    );
  }

  runDeviceValidation(
    deviceId: string,
    payload: DeviceValidationRunRequest = { scope: 'all' },
  ): Observable<DeviceValidationRunResponse> {
    return this.http.post<DeviceValidationRunResponse>(
      `/api/harbor-assistant/devices/${encodeURIComponent(deviceId)}/validation/run`,
      payload,
    );
  }

  createCameraShareLink(deviceId: string): Observable<unknown> {
    return this.http.post<unknown>(`/api/harbor-assistant/cameras/${encodeURIComponent(deviceId)}/share-link`, {});
  }

  revokeShareLink(shareLinkId: string): Observable<unknown> {
    return this.http.post<unknown>(`/api/harbor-assistant/share-links/${encodeURIComponent(shareLinkId)}/revoke`, {});
  }

  createCameraSnapshotTask(deviceId: string): Observable<unknown> {
    return this.http.post<unknown>(`/api/harbor-assistant/cameras/${encodeURIComponent(deviceId)}/snapshot`, {});
  }

  getShareLinks(): Observable<ShareLinkSummary[]> {
    return this.http.get<ShareLinkSummary[]>('/api/harbor-assistant/share-links');
  }

  private readString(record: Record<string, unknown>, key: string): string | null {
    const value = record[key];
    return typeof value === 'string' && value.trim() ? value : null;
  }

  private getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    return T('Unknown connection error.');
  }
}
