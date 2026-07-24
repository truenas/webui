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
import { harborAssistantBeaconApiUrl } from 'app/pages/harbor-assistant/services/harbor-assistant-api-prefix';

@Injectable({
  providedIn: 'root',
})
export class HarborAssistantApiService {
  private http = inject(HttpClient);

  private apiUrl(path: string): string {
    return harborAssistantBeaconApiUrl(path);
  }

  getState(): Observable<AdminStateResponse> {
    return this.http.get<AdminStateResponse>(this.apiUrl('/state'));
  }

  getBackendStatus(): Observable<HarborAssistantBackendStatus> {
    return this.http.get<Record<string, unknown>>(this.apiUrl('/state')).pipe(
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
        summary: T('HarborBeacon admin API is not reachable through the same-origin service entry.'),
        generatedAt: null,
        error: this.getErrorMessage(error),
      })),
    );
  }

  getGatewayStatus(): Observable<GatewayStatusResponse> {
    return this.http.get<GatewayStatusResponse>(this.apiUrl('/gateway/status'));
  }

  getInferenceHealth(): Observable<InferenceHealthResponse> {
    return this.http.get<InferenceHealthResponse>(this.apiUrl('/inference/healthz'));
  }

  getNotificationTargets(): Observable<NotificationTargetsResponse> {
    return this.http.get<NotificationTargetsResponse>(this.apiUrl('/admin/notification-targets'));
  }

  setDefaultNotificationTarget(targetId: string): Observable<NotificationTargetsResponse> {
    return this.http.post<NotificationTargetsResponse>(this.apiUrl('/admin/notification-targets/default'), {
      target_id: targetId,
    });
  }

  deleteNotificationTarget(targetId: string): Observable<void> {
    return this.http.delete<void>(this.apiUrl(`/admin/notification-targets/${encodeURIComponent(targetId)}`));
  }

  getHardwareReadiness(): Observable<HardwareReadinessResponse> {
    return this.http.get<HardwareReadinessResponse>(this.apiUrl('/hardware/readiness'));
  }

  getRagReadiness(): Observable<RagReadinessResponse> {
    return this.http.get<RagReadinessResponse>(this.apiUrl('/rag/readiness'));
  }

  getKnowledgeSettings(): Observable<KnowledgeSettings> {
    return this.http.get<KnowledgeSettings>(this.apiUrl('/knowledge/settings'));
  }

  saveKnowledgeSettings(payload: KnowledgeSettings): Observable<KnowledgeSettings> {
    return this.http.put<KnowledgeSettings>(this.apiUrl('/knowledge/settings'), payload);
  }

  runKnowledgeIndex(): Observable<KnowledgeIndexRunResponse> {
    return this.http.post<KnowledgeIndexRunResponse>(this.apiUrl('/knowledge/index/run'), {});
  }

  getKnowledgeIndexStatus(): Observable<KnowledgeIndexStatusResponse> {
    return this.http.get<KnowledgeIndexStatusResponse>(this.apiUrl('/knowledge/index/status'));
  }

  browseFiles(path?: string | null): Observable<FilesBrowseResponse> {
    const query = path ? `?path=${encodeURIComponent(path)}` : '';
    return this.http.get<FilesBrowseResponse>(this.apiUrl(`/files/browse${query}`));
  }

  getHarborOsStatus(): Observable<HarborOsStatusResponse> {
    return this.http.get<HarborOsStatusResponse>(this.apiUrl('/harboros/status'));
  }

  getHarborOsImCapabilityMap(): Observable<HarborOsImCapabilityMapResponse> {
    return this.http.get<HarborOsImCapabilityMapResponse>(this.apiUrl('/harboros/im-capability-map'));
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
    return this.http.get<ModelEndpointsResponse>(this.apiUrl('/models/endpoints'));
  }

  getModelCapabilities(): Observable<ModelCapabilitiesResponse> {
    return this.http.get<ModelCapabilitiesResponse>(this.apiUrl('/models/capabilities'));
  }

  getModelRuntimes(): Observable<ModelRuntimeManagerResponse> {
    return this.http.get<ModelRuntimeManagerResponse>(this.apiUrl('/models/runtimes'));
  }

  installModelRuntime(runtimeId: string): Observable<ModelRuntimeInstallResponse> {
    return this.http.post<ModelRuntimeInstallResponse>(
      this.apiUrl(`/models/runtimes/${encodeURIComponent(runtimeId)}/install`),
      {},
    );
  }

  updateModelStore(path: string): Observable<ModelStoreStatusResponse> {
    return this.http.put<ModelStoreStatusResponse>(this.apiUrl('/models/store'), { path });
  }

  selectModelCapability(capabilityId: string, modelId: string): Observable<ModelCapabilitiesResponse> {
    return this.http.post<ModelCapabilitiesResponse>(
      this.apiUrl(`/models/capabilities/${encodeURIComponent(capabilityId)}/selection`),
      { model_id: modelId },
    );
  }

  createModelEndpoint(payload: ModelEndpointPayload): Observable<ModelEndpointsResponse> {
    return this.http.post<ModelEndpointsResponse>(this.apiUrl('/models/endpoints'), payload);
  }

  updateModelEndpoint(
    modelEndpointId: string,
    payload: Partial<ModelEndpointPayload>,
  ): Observable<ModelEndpointsResponse> {
    return this.http.patch<ModelEndpointsResponse>(
      this.apiUrl(`/models/endpoints/${encodeURIComponent(modelEndpointId)}`),
      payload,
    );
  }

  testModelEndpoint(modelEndpointId: string): Observable<ModelEndpointTestResult> {
    return this.http.post<ModelEndpointTestResult>(
      this.apiUrl(`/models/endpoints/${encodeURIComponent(modelEndpointId)}/test`),
      {},
    );
  }

  getModelPolicies(): Observable<ModelPoliciesResponse> {
    return this.http.get<ModelPoliciesResponse>(this.apiUrl('/models/policies'));
  }

  saveModelPolicies(payload: ModelPoliciesResponse): Observable<ModelPoliciesResponse> {
    return this.http.put<ModelPoliciesResponse>(this.apiUrl('/models/policies'), payload);
  }

  getLocalModelCatalog(): Observable<LocalModelCatalogResponse> {
    return this.http.get<LocalModelCatalogResponse>(this.apiUrl('/models/local-catalog'));
  }

  getLocalModelDownloads(): Observable<LocalModelDownloadsResponse> {
    return this.http.get<LocalModelDownloadsResponse>(this.apiUrl('/models/local-downloads'));
  }

  createLocalModelDownload(payload: ModelDownloadRequest): Observable<LocalModelDownloadJobResponse> {
    return this.http.post<LocalModelDownloadJobResponse>(this.apiUrl('/models/local-downloads'), payload);
  }

  cancelLocalModelDownload(jobId: string): Observable<LocalModelDownloadJobResponse> {
    return this.http.post<LocalModelDownloadJobResponse>(
      this.apiUrl(`/models/local-downloads/${encodeURIComponent(jobId)}/cancel`),
      {},
    );
  }

  scanDevices(payload: DiscoveryScanPayload): Observable<DiscoveryScanResponse> {
    return this.http.post<DiscoveryScanResponse>(this.apiUrl('/discovery/scan'), payload);
  }

  addManualDevice(payload: ManualDevicePayload): Observable<unknown> {
    return this.http.post<unknown>(this.apiUrl('/devices/manual'), payload);
  }

  setDefaultCamera(deviceId: string | null): Observable<AdminStateResponse> {
    return this.http.post<AdminStateResponse>(this.apiUrl('/devices/default-camera'), {
      device_id: deviceId,
    });
  }

  updateDeviceMetadata(deviceId: string, payload: DeviceMetadataPatchPayload): Observable<AdminStateResponse> {
    return this.http.patch<AdminStateResponse>(
      this.apiUrl(`/devices/${encodeURIComponent(deviceId)}`),
      payload,
    );
  }

  deleteDevice(deviceId: string): Observable<AdminStateResponse> {
    return this.http.delete<AdminStateResponse>(
      this.apiUrl(`/devices/${encodeURIComponent(deviceId)}`),
    );
  }

  saveDefaults(payload: AdminDefaultsPayload): Observable<unknown> {
    return this.http.post<unknown>(this.apiUrl('/defaults'), payload);
  }

  saveDeviceCredentials(deviceId: string, payload: DeviceCredentialsPayload): Observable<DeviceCredentialStatus> {
    return this.http.post<DeviceCredentialStatus>(
      this.apiUrl(`/devices/${encodeURIComponent(deviceId)}/credentials`),
      payload,
    );
  }

  checkDeviceRtsp(deviceId: string, payload: RtspCheckPayload): Observable<RtspCheckResult> {
    return this.http.post<RtspCheckResult>(
      this.apiUrl(`/devices/${encodeURIComponent(deviceId)}/rtsp-check`),
      payload,
    );
  }

  getDeviceEvidence(deviceId: string): Observable<DeviceEvidenceResponse> {
    return this.http.get<DeviceEvidenceResponse>(
      this.apiUrl(`/devices/${encodeURIComponent(deviceId)}/evidence`),
    );
  }

  getDvrRecordingSettings(): Observable<DvrRecordingSettings> {
    return this.http.get<DvrRecordingSettings>(this.apiUrl('/cameras/recording-settings'));
  }

  saveDvrRecordingSettings(payload: DvrRecordingSettings): Observable<DvrRecordingSettings> {
    return this.http.put<DvrRecordingSettings>(this.apiUrl('/cameras/recording-settings'), payload);
  }

  getDvrRecordingStatus(): Observable<DvrRecordingStatusResponse> {
    return this.http.get<DvrRecordingStatusResponse>(this.apiUrl('/cameras/recordings/status'));
  }

  getDvrTimeline(deviceId?: string | null): Observable<DvrTimelineResponse> {
    const query = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : '';
    return this.http.get<DvrTimelineResponse>(this.apiUrl(`/cameras/recordings/timeline${query}`));
  }

  startDvrRecording(deviceId: string): Observable<DvrRecordingStatusResponse> {
    return this.http.post<DvrRecordingStatusResponse>(
      this.apiUrl(`/cameras/${encodeURIComponent(deviceId)}/recordings/start`),
      {},
    );
  }

  stopDvrRecording(deviceId: string): Observable<DvrRecordingStatusResponse> {
    return this.http.post<DvrRecordingStatusResponse>(
      this.apiUrl(`/cameras/${encodeURIComponent(deviceId)}/recordings/stop`),
      {},
    );
  }

  runDeviceValidation(
    deviceId: string,
    payload: DeviceValidationRunRequest = { scope: 'all' },
  ): Observable<DeviceValidationRunResponse> {
    return this.http.post<DeviceValidationRunResponse>(
      this.apiUrl(`/devices/${encodeURIComponent(deviceId)}/validation/run`),
      payload,
    );
  }

  createCameraShareLink(deviceId: string): Observable<unknown> {
    return this.http.post<unknown>(this.apiUrl(`/cameras/${encodeURIComponent(deviceId)}/share-link`), {});
  }

  revokeShareLink(shareLinkId: string): Observable<unknown> {
    return this.http.post<unknown>(this.apiUrl(`/share-links/${encodeURIComponent(shareLinkId)}/revoke`), {});
  }

  createCameraSnapshotTask(deviceId: string): Observable<unknown> {
    return this.http.post<unknown>(this.apiUrl(`/cameras/${encodeURIComponent(deviceId)}/snapshot`), {});
  }

  getShareLinks(): Observable<ShareLinkSummary[]> {
    return this.http.get<ShareLinkSummary[]>(this.apiUrl('/share-links'));
  }

  getLocalVisionEvents(limit = 5): Observable<LocalVisionEventsResponse> {
    return this.http.get<LocalVisionEventsResponse>(
      this.apiUrl(`/vision/events?limit=${encodeURIComponent(String(limit))}`),
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
