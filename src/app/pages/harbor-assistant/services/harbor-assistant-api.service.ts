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
    return `/api/harbor-beacon${path}`;
  }

  getState(): Observable<AdminStateResponse> {
    return this.http.get<AdminStateResponse>('/api/harbor-beacon/state');
  }

  getBackendStatus(): Observable<HarborAssistantBackendStatus> {
    return this.http.get<Record<string, unknown>>('/api/harbor-beacon/state').pipe(
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
        summary: T('HarborBeacon admin API is not reachable through the /api/harbor-beacon service entry.'),
        generatedAt: null,
        error: this.getErrorMessage(error),
      })),
    );
  }

  getGatewayStatus(): Observable<GatewayStatusResponse> {
    return this.http.get<GatewayStatusResponse>('/api/harbor-beacon/gateway/status');
  }

  getInferenceHealth(): Observable<InferenceHealthResponse> {
    return this.http.get<InferenceHealthResponse>('/api/harbor-beacon/inference/healthz');
  }

  getNotificationTargets(): Observable<NotificationTargetsResponse> {
    return this.http.get<NotificationTargetsResponse>('/api/harbor-beacon/admin/notification-targets');
  }

  setDefaultNotificationTarget(targetId: string): Observable<NotificationTargetsResponse> {
    return this.http.post<NotificationTargetsResponse>('/api/harbor-beacon/admin/notification-targets/default', {
      target_id: targetId,
    });
  }

  deleteNotificationTarget(targetId: string): Observable<void> {
    return this.http.delete<void>(`/api/harbor-beacon/admin/notification-targets/${encodeURIComponent(targetId)}`);
  }

  getHardwareReadiness(): Observable<HardwareReadinessResponse> {
    return this.http.get<HardwareReadinessResponse>('/api/harbor-beacon/hardware/readiness');
  }

  getRagReadiness(): Observable<RagReadinessResponse> {
    return this.http.get<RagReadinessResponse>('/api/harbor-beacon/rag/readiness');
  }

  getKnowledgeSettings(): Observable<KnowledgeSettings> {
    return this.http.get<KnowledgeSettings>('/api/harbor-beacon/knowledge/settings');
  }

  saveKnowledgeSettings(payload: KnowledgeSettings): Observable<KnowledgeSettings> {
    return this.http.put<KnowledgeSettings>('/api/harbor-beacon/knowledge/settings', payload);
  }

  runKnowledgeIndex(): Observable<KnowledgeIndexRunResponse> {
    return this.http.post<KnowledgeIndexRunResponse>('/api/harbor-beacon/knowledge/index/run', {});
  }

  getKnowledgeIndexStatus(): Observable<KnowledgeIndexStatusResponse> {
    return this.http.get<KnowledgeIndexStatusResponse>('/api/harbor-beacon/knowledge/index/status');
  }

  browseFiles(path?: string | null): Observable<FilesBrowseResponse> {
    const query = path ? `?path=${encodeURIComponent(path)}` : '';
    return this.http.get<FilesBrowseResponse>(`/api/harbor-beacon/files/browse${query}`);
  }

  getHarborOsStatus(): Observable<HarborOsStatusResponse> {
    return this.http.get<HarborOsStatusResponse>('/api/harbor-beacon/harboros/status');
  }

  getHarborOsImCapabilityMap(): Observable<HarborOsImCapabilityMapResponse> {
    return this.http.get<HarborOsImCapabilityMapResponse>('/api/harbor-beacon/harboros/im-capability-map');
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
    return this.http.get<ModelEndpointsResponse>('/api/harbor-beacon/models/endpoints');
  }

  getModelCapabilities(): Observable<ModelCapabilitiesResponse> {
    return this.http.get<ModelCapabilitiesResponse>('/api/harbor-beacon/models/capabilities');
  }

  updateModelStore(path: string): Observable<ModelStoreStatusResponse> {
    return this.http.put<ModelStoreStatusResponse>('/api/harbor-beacon/models/store', { path });
  }

  selectModelCapability(capabilityId: string, modelId: string): Observable<ModelCapabilitiesResponse> {
    return this.http.post<ModelCapabilitiesResponse>(
      `/api/harbor-beacon/models/capabilities/${encodeURIComponent(capabilityId)}/selection`,
      { model_id: modelId },
    );
  }

  createModelEndpoint(payload: ModelEndpointPayload): Observable<ModelEndpointsResponse> {
    return this.http.post<ModelEndpointsResponse>('/api/harbor-beacon/models/endpoints', payload);
  }

  updateModelEndpoint(modelEndpointId: string, payload: Partial<ModelEndpointPayload>): Observable<ModelEndpointsResponse> {
    return this.http.patch<ModelEndpointsResponse>(
      `/api/harbor-beacon/models/endpoints/${encodeURIComponent(modelEndpointId)}`,
      payload,
    );
  }

  testModelEndpoint(modelEndpointId: string): Observable<ModelEndpointTestResult> {
    return this.http.post<ModelEndpointTestResult>(
      `/api/harbor-beacon/models/endpoints/${encodeURIComponent(modelEndpointId)}/test`,
      {},
    );
  }

  getModelPolicies(): Observable<ModelPoliciesResponse> {
    return this.http.get<ModelPoliciesResponse>('/api/harbor-beacon/models/policies');
  }

  saveModelPolicies(payload: ModelPoliciesResponse): Observable<ModelPoliciesResponse> {
    return this.http.put<ModelPoliciesResponse>('/api/harbor-beacon/models/policies', payload);
  }

  getLocalModelCatalog(): Observable<LocalModelCatalogResponse> {
    return this.http.get<LocalModelCatalogResponse>('/api/harbor-beacon/models/local-catalog');
  }

  getLocalModelDownloads(): Observable<LocalModelDownloadsResponse> {
    return this.http.get<LocalModelDownloadsResponse>('/api/harbor-beacon/models/local-downloads');
  }

  createLocalModelDownload(payload: ModelDownloadRequest): Observable<LocalModelDownloadJobResponse> {
    return this.http.post<LocalModelDownloadJobResponse>('/api/harbor-beacon/models/local-downloads', payload);
  }

  cancelLocalModelDownload(jobId: string): Observable<LocalModelDownloadJobResponse> {
    return this.http.post<LocalModelDownloadJobResponse>(
      `/api/harbor-beacon/models/local-downloads/${encodeURIComponent(jobId)}/cancel`,
      {},
    );
  }

  scanDevices(payload: DiscoveryScanPayload): Observable<DiscoveryScanResponse> {
    return this.http.post<DiscoveryScanResponse>('/api/harbor-beacon/discovery/scan', payload);
  }

  addManualDevice(payload: ManualDevicePayload): Observable<unknown> {
    return this.http.post<unknown>('/api/harbor-beacon/devices/manual', payload);
  }

  setDefaultCamera(deviceId: string | null): Observable<AdminStateResponse> {
    return this.http.post<AdminStateResponse>('/api/harbor-beacon/devices/default-camera', {
      device_id: deviceId,
    });
  }

  updateDeviceMetadata(deviceId: string, payload: DeviceMetadataPatchPayload): Observable<AdminStateResponse> {
    return this.http.patch<AdminStateResponse>(
      `/api/harbor-beacon/devices/${encodeURIComponent(deviceId)}`,
      payload,
    );
  }

  deleteDevice(deviceId: string): Observable<AdminStateResponse> {
    return this.http.delete<AdminStateResponse>(
      `/api/harbor-beacon/devices/${encodeURIComponent(deviceId)}`,
    );
  }

  saveDefaults(payload: AdminDefaultsPayload): Observable<unknown> {
    return this.http.post<unknown>('/api/harbor-beacon/defaults', payload);
  }

  saveDeviceCredentials(deviceId: string, payload: DeviceCredentialsPayload): Observable<DeviceCredentialStatus> {
    return this.http.post<DeviceCredentialStatus>(
      `/api/harbor-beacon/devices/${encodeURIComponent(deviceId)}/credentials`,
      payload,
    );
  }

  checkDeviceRtsp(deviceId: string, payload: RtspCheckPayload): Observable<RtspCheckResult> {
    return this.http.post<RtspCheckResult>(
      `/api/harbor-beacon/devices/${encodeURIComponent(deviceId)}/rtsp-check`,
      payload,
    );
  }

  getDeviceEvidence(deviceId: string): Observable<DeviceEvidenceResponse> {
    return this.http.get<DeviceEvidenceResponse>(
      `/api/harbor-beacon/devices/${encodeURIComponent(deviceId)}/evidence`,
    );
  }

  getDvrRecordingSettings(): Observable<DvrRecordingSettings> {
    return this.http.get<DvrRecordingSettings>('/api/harbor-beacon/cameras/recording-settings');
  }

  saveDvrRecordingSettings(payload: DvrRecordingSettings): Observable<DvrRecordingSettings> {
    return this.http.put<DvrRecordingSettings>('/api/harbor-beacon/cameras/recording-settings', payload);
  }

  getDvrRecordingStatus(): Observable<DvrRecordingStatusResponse> {
    return this.http.get<DvrRecordingStatusResponse>('/api/harbor-beacon/cameras/recordings/status');
  }

  getDvrTimeline(deviceId?: string | null): Observable<DvrTimelineResponse> {
    const query = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : '';
    return this.http.get<DvrTimelineResponse>(`/api/harbor-beacon/cameras/recordings/timeline${query}`);
  }

  startDvrRecording(deviceId: string): Observable<DvrRecordingStatusResponse> {
    return this.http.post<DvrRecordingStatusResponse>(
      `/api/harbor-beacon/cameras/${encodeURIComponent(deviceId)}/recordings/start`,
      {},
    );
  }

  stopDvrRecording(deviceId: string): Observable<DvrRecordingStatusResponse> {
    return this.http.post<DvrRecordingStatusResponse>(
      `/api/harbor-beacon/cameras/${encodeURIComponent(deviceId)}/recordings/stop`,
      {},
    );
  }

  runDeviceValidation(
    deviceId: string,
    payload: DeviceValidationRunRequest = { scope: 'all' },
  ): Observable<DeviceValidationRunResponse> {
    return this.http.post<DeviceValidationRunResponse>(
      `/api/harbor-beacon/devices/${encodeURIComponent(deviceId)}/validation/run`,
      payload,
    );
  }

  createCameraShareLink(deviceId: string): Observable<unknown> {
    return this.http.post<unknown>(`/api/harbor-beacon/cameras/${encodeURIComponent(deviceId)}/share-link`, {});
  }

  revokeShareLink(shareLinkId: string): Observable<unknown> {
    return this.http.post<unknown>(`/api/harbor-beacon/share-links/${encodeURIComponent(shareLinkId)}/revoke`, {});
  }

  createCameraSnapshotTask(deviceId: string): Observable<unknown> {
    return this.http.post<unknown>(`/api/harbor-beacon/cameras/${encodeURIComponent(deviceId)}/snapshot`, {});
  }

  getShareLinks(): Observable<ShareLinkSummary[]> {
    return this.http.get<ShareLinkSummary[]>('/api/harbor-beacon/share-links');
  }

  getLocalVisionEvents(limit = 5): Observable<LocalVisionEventsResponse> {
    return this.http.get<LocalVisionEventsResponse>(
      `/api/harbor-beacon/vision/events?limit=${encodeURIComponent(String(limit))}`,
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
