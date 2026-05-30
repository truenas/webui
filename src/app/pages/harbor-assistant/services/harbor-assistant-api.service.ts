import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  AdminDefaultsPayload,
  AdminStateResponse,
  AutomationReviewPayload,
  AutomationReviewsResponse,
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
  LocalVisionEventsResponse,
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
  ModelRuntimeInstallResponse,
  ModelRuntimeManagerResponse,
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
    return `/api/beacon${path}`;
  }

  getState(): Observable<AdminStateResponse> {
    return this.http.get<AdminStateResponse>('/api/beacon/state');
  }

  getBackendStatus(): Observable<HarborAssistantBackendStatus> {
    return this.http.get<Record<string, unknown>>('/api/beacon/state').pipe(
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
        summary: T('HarborBeacon admin API is not reachable through the /api/beacon service entry.'),
        generatedAt: null,
        error: this.getErrorMessage(error),
      })),
    );
  }

  getGatewayStatus(): Observable<GatewayStatusResponse> {
    return this.http.get<GatewayStatusResponse>('/api/beacon/gateway/status');
  }

  getInferenceHealth(): Observable<InferenceHealthResponse> {
    return this.http.get<InferenceHealthResponse>('/api/beacon/inference/healthz');
  }

  getNotificationTargets(): Observable<NotificationTargetsResponse> {
    return this.http.get<NotificationTargetsResponse>('/api/beacon/admin/notification-targets');
  }

  setDefaultNotificationTarget(targetId: string): Observable<NotificationTargetsResponse> {
    return this.http.post<NotificationTargetsResponse>('/api/beacon/admin/notification-targets/default', {
      target_id: targetId,
    });
  }

  deleteNotificationTarget(targetId: string): Observable<void> {
    return this.http.delete<void>(`/api/beacon/admin/notification-targets/${encodeURIComponent(targetId)}`);
  }

  getHardwareReadiness(): Observable<HardwareReadinessResponse> {
    return this.http.get<HardwareReadinessResponse>('/api/beacon/hardware/readiness');
  }

  getRagReadiness(): Observable<RagReadinessResponse> {
    return this.http.get<RagReadinessResponse>('/api/beacon/rag/readiness');
  }

  getKnowledgeSettings(): Observable<KnowledgeSettings> {
    return this.http.get<KnowledgeSettings>('/api/beacon/knowledge/settings');
  }

  saveKnowledgeSettings(payload: KnowledgeSettings): Observable<KnowledgeSettings> {
    return this.http.put<KnowledgeSettings>('/api/beacon/knowledge/settings', payload);
  }

  runKnowledgeIndex(): Observable<KnowledgeIndexRunResponse> {
    return this.http.post<KnowledgeIndexRunResponse>('/api/beacon/knowledge/index/run', {});
  }

  getKnowledgeIndexStatus(): Observable<KnowledgeIndexStatusResponse> {
    return this.http.get<KnowledgeIndexStatusResponse>('/api/beacon/knowledge/index/status');
  }

  browseFiles(path?: string | null): Observable<FilesBrowseResponse> {
    const query = path ? `?path=${encodeURIComponent(path)}` : '';
    return this.http.get<FilesBrowseResponse>(`/api/beacon/files/browse${query}`);
  }

  getHarborOsStatus(): Observable<HarborOsStatusResponse> {
    return this.http.get<HarborOsStatusResponse>('/api/beacon/harboros/status');
  }

  getHarborOsImCapabilityMap(): Observable<HarborOsImCapabilityMapResponse> {
    return this.http.get<HarborOsImCapabilityMapResponse>('/api/beacon/harboros/im-capability-map');
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

  getAutomationReviews(): Observable<AutomationReviewsResponse> {
    return this.http.get<AutomationReviewsResponse>(this.apiUrl('/automation/reviews'));
  }

  createAutomationReview(payload: AutomationReviewPayload): Observable<AutomationReviewsResponse> {
    return this.http.post<AutomationReviewsResponse>(this.apiUrl('/automation/reviews'), payload);
  }

  enableAutomationReview(reviewId: string): Observable<AutomationReviewsResponse> {
    return this.http.post<AutomationReviewsResponse>(
      this.apiUrl(`/automation/reviews/${encodeURIComponent(reviewId)}/enable`),
      {},
    );
  }

  pauseAutomationReview(reviewId: string): Observable<AutomationReviewsResponse> {
    return this.http.post<AutomationReviewsResponse>(
      this.apiUrl(`/automation/reviews/${encodeURIComponent(reviewId)}/pause`),
      {},
    );
  }

  discardAutomationReview(reviewId: string): Observable<AutomationReviewsResponse> {
    return this.http.post<AutomationReviewsResponse>(
      this.apiUrl(`/automation/reviews/${encodeURIComponent(reviewId)}/discard`),
      {},
    );
  }

  getModelEndpoints(): Observable<ModelEndpointsResponse> {
    return this.http.get<ModelEndpointsResponse>('/api/beacon/models/endpoints');
  }

  getModelCapabilities(): Observable<ModelCapabilitiesResponse> {
    return this.http.get<ModelCapabilitiesResponse>('/api/beacon/models/capabilities');
  }

  getModelRuntimes(): Observable<ModelRuntimeManagerResponse> {
    return this.http.get<ModelRuntimeManagerResponse>('/api/beacon/models/runtimes');
  }

  installModelRuntime(runtimeId: string): Observable<ModelRuntimeInstallResponse> {
    return this.http.post<ModelRuntimeInstallResponse>(
      `/api/beacon/models/runtimes/${encodeURIComponent(runtimeId)}/install`,
      {},
    );
  }

  updateModelStore(path: string): Observable<ModelStoreStatusResponse> {
    return this.http.put<ModelStoreStatusResponse>('/api/beacon/models/store', { path });
  }

  selectModelCapability(capabilityId: string, modelId: string): Observable<ModelCapabilitiesResponse> {
    return this.http.post<ModelCapabilitiesResponse>(
      `/api/beacon/models/capabilities/${encodeURIComponent(capabilityId)}/selection`,
      { model_id: modelId },
    );
  }

  createModelEndpoint(payload: ModelEndpointPayload): Observable<ModelEndpointsResponse> {
    return this.http.post<ModelEndpointsResponse>('/api/beacon/models/endpoints', payload);
  }

  updateModelEndpoint(modelEndpointId: string, payload: Partial<ModelEndpointPayload>): Observable<ModelEndpointsResponse> {
    return this.http.patch<ModelEndpointsResponse>(
      `/api/beacon/models/endpoints/${encodeURIComponent(modelEndpointId)}`,
      payload,
    );
  }

  testModelEndpoint(modelEndpointId: string): Observable<ModelEndpointTestResult> {
    return this.http.post<ModelEndpointTestResult>(
      `/api/beacon/models/endpoints/${encodeURIComponent(modelEndpointId)}/test`,
      {},
    );
  }

  getModelPolicies(): Observable<ModelPoliciesResponse> {
    return this.http.get<ModelPoliciesResponse>('/api/beacon/models/policies');
  }

  saveModelPolicies(payload: ModelPoliciesResponse): Observable<ModelPoliciesResponse> {
    return this.http.put<ModelPoliciesResponse>('/api/beacon/models/policies', payload);
  }

  getLocalModelCatalog(): Observable<LocalModelCatalogResponse> {
    return this.http.get<LocalModelCatalogResponse>('/api/beacon/models/local-catalog');
  }

  getLocalModelDownloads(): Observable<LocalModelDownloadsResponse> {
    return this.http.get<LocalModelDownloadsResponse>('/api/beacon/models/local-downloads');
  }

  createLocalModelDownload(payload: ModelDownloadRequest): Observable<LocalModelDownloadJobResponse> {
    return this.http.post<LocalModelDownloadJobResponse>('/api/beacon/models/local-downloads', payload);
  }

  cancelLocalModelDownload(jobId: string): Observable<LocalModelDownloadJobResponse> {
    return this.http.post<LocalModelDownloadJobResponse>(
      `/api/beacon/models/local-downloads/${encodeURIComponent(jobId)}/cancel`,
      {},
    );
  }

  scanDevices(payload: DiscoveryScanPayload): Observable<DiscoveryScanResponse> {
    return this.http.post<DiscoveryScanResponse>('/api/beacon/discovery/scan', payload);
  }

  addManualDevice(payload: ManualDevicePayload): Observable<unknown> {
    return this.http.post<unknown>('/api/beacon/devices/manual', payload);
  }

  setDefaultCamera(deviceId: string | null): Observable<AdminStateResponse> {
    return this.http.post<AdminStateResponse>('/api/beacon/devices/default-camera', {
      device_id: deviceId,
    });
  }

  updateDeviceMetadata(deviceId: string, payload: DeviceMetadataPatchPayload): Observable<AdminStateResponse> {
    return this.http.patch<AdminStateResponse>(
      `/api/beacon/devices/${encodeURIComponent(deviceId)}`,
      payload,
    );
  }

  deleteDevice(deviceId: string): Observable<AdminStateResponse> {
    return this.http.delete<AdminStateResponse>(
      `/api/beacon/devices/${encodeURIComponent(deviceId)}`,
    );
  }

  saveDefaults(payload: AdminDefaultsPayload): Observable<unknown> {
    return this.http.post<unknown>('/api/beacon/defaults', payload);
  }

  saveDeviceCredentials(deviceId: string, payload: DeviceCredentialsPayload): Observable<DeviceCredentialStatus> {
    return this.http.post<DeviceCredentialStatus>(
      `/api/beacon/devices/${encodeURIComponent(deviceId)}/credentials`,
      payload,
    );
  }

  checkDeviceRtsp(deviceId: string, payload: RtspCheckPayload): Observable<RtspCheckResult> {
    return this.http.post<RtspCheckResult>(
      `/api/beacon/devices/${encodeURIComponent(deviceId)}/rtsp-check`,
      payload,
    );
  }

  getDeviceEvidence(deviceId: string): Observable<DeviceEvidenceResponse> {
    return this.http.get<DeviceEvidenceResponse>(
      `/api/beacon/devices/${encodeURIComponent(deviceId)}/evidence`,
    );
  }

  getDvrRecordingSettings(): Observable<DvrRecordingSettings> {
    return this.http.get<DvrRecordingSettings>('/api/beacon/cameras/recording-settings');
  }

  saveDvrRecordingSettings(payload: DvrRecordingSettings): Observable<DvrRecordingSettings> {
    return this.http.put<DvrRecordingSettings>('/api/beacon/cameras/recording-settings', payload);
  }

  getDvrRecordingStatus(): Observable<DvrRecordingStatusResponse> {
    return this.http.get<DvrRecordingStatusResponse>('/api/beacon/cameras/recordings/status');
  }

  getDvrTimeline(deviceId?: string | null): Observable<DvrTimelineResponse> {
    const query = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : '';
    return this.http.get<DvrTimelineResponse>(`/api/beacon/cameras/recordings/timeline${query}`);
  }

  startDvrRecording(deviceId: string): Observable<DvrRecordingStatusResponse> {
    return this.http.post<DvrRecordingStatusResponse>(
      `/api/beacon/cameras/${encodeURIComponent(deviceId)}/recordings/start`,
      {},
    );
  }

  stopDvrRecording(deviceId: string): Observable<DvrRecordingStatusResponse> {
    return this.http.post<DvrRecordingStatusResponse>(
      `/api/beacon/cameras/${encodeURIComponent(deviceId)}/recordings/stop`,
      {},
    );
  }

  runDeviceValidation(
    deviceId: string,
    payload: DeviceValidationRunRequest = { scope: 'all' },
  ): Observable<DeviceValidationRunResponse> {
    return this.http.post<DeviceValidationRunResponse>(
      `/api/beacon/devices/${encodeURIComponent(deviceId)}/validation/run`,
      payload,
    );
  }

  createCameraShareLink(deviceId: string): Observable<unknown> {
    return this.http.post<unknown>(`/api/beacon/cameras/${encodeURIComponent(deviceId)}/share-link`, {});
  }

  revokeShareLink(shareLinkId: string): Observable<unknown> {
    return this.http.post<unknown>(`/api/beacon/share-links/${encodeURIComponent(shareLinkId)}/revoke`, {});
  }

  createCameraSnapshotTask(deviceId: string): Observable<unknown> {
    return this.http.post<unknown>(`/api/beacon/cameras/${encodeURIComponent(deviceId)}/snapshot`, {});
  }

  getShareLinks(): Observable<ShareLinkSummary[]> {
    return this.http.get<ShareLinkSummary[]>('/api/beacon/share-links');
  }

  getLocalVisionEvents(limit = 5): Observable<LocalVisionEventsResponse> {
    return this.http.get<LocalVisionEventsResponse>(
      `/api/beacon/vision/events?limit=${encodeURIComponent(String(limit))}`,
    );
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
