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
  DeviceValidationRunRequest,
  DeviceValidationRunResponse,
  DiscoveryScanPayload,
  FilesBrowseResponse,
  GatewayStatusResponse,
  HarborDeskBackendStatus,
  HarborOsImCapabilityMapResponse,
  HarborOsStatusResponse,
  HardwareReadinessResponse,
  KnowledgeIndexRunResponse,
  KnowledgeIndexStatusResponse,
  KnowledgeSettings,
  LocalModelCatalogResponse,
  LocalModelDownloadJobResponse,
  LocalModelDownloadsResponse,
  ManualDevicePayload,
  ModelDownloadRequest,
  ModelEndpointPayload,
  ModelEndpointsResponse,
  ModelEndpointTestResult,
  ModelPoliciesResponse,
  NotificationTargetsResponse,
  RagReadinessResponse,
  RtspCheckPayload,
  RtspCheckResult,
  ShareLinkSummary,
} from 'app/pages/harbordesk/interfaces/harbordesk-status.interface';

@Injectable({
  providedIn: 'root',
})
export class HarborDeskApiService {
  private http = inject(HttpClient);

  getState(): Observable<AdminStateResponse> {
    return this.http.get<AdminStateResponse>('/api/harbordesk/state');
  }

  getBackendStatus(): Observable<HarborDeskBackendStatus> {
    return this.http.get<Record<string, unknown>>('/api/harbordesk/state').pipe(
      map((state): HarborDeskBackendStatus => ({
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
        summary: T('HarborBeacon admin API is not reachable through the HarborDesk proxy.'),
        generatedAt: null,
        error: this.getErrorMessage(error),
      })),
    );
  }

  getGatewayStatus(): Observable<GatewayStatusResponse> {
    return this.http.get<GatewayStatusResponse>('/api/harbordesk/gateway/status');
  }

  getNotificationTargets(): Observable<NotificationTargetsResponse> {
    return this.http.get<NotificationTargetsResponse>('/api/harbordesk/admin/notification-targets');
  }

  setDefaultNotificationTarget(targetId: string): Observable<NotificationTargetsResponse> {
    return this.http.post<NotificationTargetsResponse>('/api/harbordesk/admin/notification-targets/default', {
      target_id: targetId,
    });
  }

  deleteNotificationTarget(targetId: string): Observable<void> {
    return this.http.delete<void>(`/api/harbordesk/admin/notification-targets/${encodeURIComponent(targetId)}`);
  }

  getHardwareReadiness(): Observable<HardwareReadinessResponse> {
    return this.http.get<HardwareReadinessResponse>('/api/harbordesk/hardware/readiness');
  }

  getRagReadiness(): Observable<RagReadinessResponse> {
    return this.http.get<RagReadinessResponse>('/api/harbordesk/rag/readiness');
  }

  getKnowledgeSettings(): Observable<KnowledgeSettings> {
    return this.http.get<KnowledgeSettings>('/api/harbordesk/knowledge/settings');
  }

  saveKnowledgeSettings(payload: KnowledgeSettings): Observable<KnowledgeSettings> {
    return this.http.put<KnowledgeSettings>('/api/harbordesk/knowledge/settings', payload);
  }

  runKnowledgeIndex(): Observable<KnowledgeIndexRunResponse> {
    return this.http.post<KnowledgeIndexRunResponse>('/api/harbordesk/knowledge/index/run', {});
  }

  getKnowledgeIndexStatus(): Observable<KnowledgeIndexStatusResponse> {
    return this.http.get<KnowledgeIndexStatusResponse>('/api/harbordesk/knowledge/index/status');
  }

  browseFiles(path?: string | null): Observable<FilesBrowseResponse> {
    const query = path ? `?path=${encodeURIComponent(path)}` : '';
    return this.http.get<FilesBrowseResponse>(`/api/harbordesk/files/browse${query}`);
  }

  getHarborOsStatus(): Observable<HarborOsStatusResponse> {
    return this.http.get<HarborOsStatusResponse>('/api/harbordesk/harboros/status');
  }

  getHarborOsImCapabilityMap(): Observable<HarborOsImCapabilityMapResponse> {
    return this.http.get<HarborOsImCapabilityMapResponse>('/api/harbordesk/harboros/im-capability-map');
  }

  getModelEndpoints(): Observable<ModelEndpointsResponse> {
    return this.http.get<ModelEndpointsResponse>('/api/harbordesk/models/endpoints');
  }

  createModelEndpoint(payload: ModelEndpointPayload): Observable<ModelEndpointsResponse> {
    return this.http.post<ModelEndpointsResponse>('/api/harbordesk/models/endpoints', payload);
  }

  updateModelEndpoint(modelEndpointId: string, payload: Partial<ModelEndpointPayload>): Observable<ModelEndpointsResponse> {
    return this.http.patch<ModelEndpointsResponse>(
      `/api/harbordesk/models/endpoints/${encodeURIComponent(modelEndpointId)}`,
      payload,
    );
  }

  testModelEndpoint(modelEndpointId: string): Observable<ModelEndpointTestResult> {
    return this.http.post<ModelEndpointTestResult>(
      `/api/harbordesk/models/endpoints/${encodeURIComponent(modelEndpointId)}/test`,
      {},
    );
  }

  getModelPolicies(): Observable<ModelPoliciesResponse> {
    return this.http.get<ModelPoliciesResponse>('/api/harbordesk/models/policies');
  }

  saveModelPolicies(payload: ModelPoliciesResponse): Observable<ModelPoliciesResponse> {
    return this.http.put<ModelPoliciesResponse>('/api/harbordesk/models/policies', payload);
  }

  getLocalModelCatalog(): Observable<LocalModelCatalogResponse> {
    return this.http.get<LocalModelCatalogResponse>('/api/harbordesk/models/local-catalog');
  }

  getLocalModelDownloads(): Observable<LocalModelDownloadsResponse> {
    return this.http.get<LocalModelDownloadsResponse>('/api/harbordesk/models/local-downloads');
  }

  createLocalModelDownload(payload: ModelDownloadRequest): Observable<LocalModelDownloadJobResponse> {
    return this.http.post<LocalModelDownloadJobResponse>('/api/harbordesk/models/local-downloads', payload);
  }

  cancelLocalModelDownload(jobId: string): Observable<LocalModelDownloadJobResponse> {
    return this.http.post<LocalModelDownloadJobResponse>(
      `/api/harbordesk/models/local-downloads/${encodeURIComponent(jobId)}/cancel`,
      {},
    );
  }

  scanDevices(payload: DiscoveryScanPayload): Observable<unknown> {
    return this.http.post<unknown>('/api/harbordesk/discovery/scan', payload);
  }

  addManualDevice(payload: ManualDevicePayload): Observable<unknown> {
    return this.http.post<unknown>('/api/harbordesk/devices/manual', payload);
  }

  setDefaultCamera(deviceId: string | null): Observable<AdminStateResponse> {
    return this.http.post<AdminStateResponse>('/api/harbordesk/devices/default-camera', {
      device_id: deviceId,
    });
  }

  updateDeviceMetadata(deviceId: string, payload: DeviceMetadataPatchPayload): Observable<AdminStateResponse> {
    return this.http.patch<AdminStateResponse>(
      `/api/harbordesk/devices/${encodeURIComponent(deviceId)}`,
      payload,
    );
  }

  saveDefaults(payload: AdminDefaultsPayload): Observable<unknown> {
    return this.http.post<unknown>('/api/harbordesk/defaults', payload);
  }

  saveDeviceCredentials(deviceId: string, payload: DeviceCredentialsPayload): Observable<DeviceCredentialStatus> {
    return this.http.post<DeviceCredentialStatus>(
      `/api/harbordesk/devices/${encodeURIComponent(deviceId)}/credentials`,
      payload,
    );
  }

  checkDeviceRtsp(deviceId: string, payload: RtspCheckPayload): Observable<RtspCheckResult> {
    return this.http.post<RtspCheckResult>(
      `/api/harbordesk/devices/${encodeURIComponent(deviceId)}/rtsp-check`,
      payload,
    );
  }

  getDeviceEvidence(deviceId: string): Observable<DeviceEvidenceResponse> {
    return this.http.get<DeviceEvidenceResponse>(
      `/api/harbordesk/devices/${encodeURIComponent(deviceId)}/evidence`,
    );
  }

  runDeviceValidation(
    deviceId: string,
    payload: DeviceValidationRunRequest = { scope: 'all' },
  ): Observable<DeviceValidationRunResponse> {
    return this.http.post<DeviceValidationRunResponse>(
      `/api/harbordesk/devices/${encodeURIComponent(deviceId)}/validation/run`,
      payload,
    );
  }

  createCameraShareLink(deviceId: string): Observable<unknown> {
    return this.http.post<unknown>(`/api/harbordesk/cameras/${encodeURIComponent(deviceId)}/share-link`, {});
  }

  revokeShareLink(shareLinkId: string): Observable<unknown> {
    return this.http.post<unknown>(`/api/harbordesk/share-links/${encodeURIComponent(shareLinkId)}/revoke`, {});
  }

  createCameraSnapshotTask(deviceId: string): Observable<unknown> {
    return this.http.post<unknown>(`/api/harbordesk/cameras/${encodeURIComponent(deviceId)}/snapshot`, {});
  }

  getShareLinks(): Observable<ShareLinkSummary[]> {
    return this.http.get<ShareLinkSummary[]>('/api/harbordesk/share-links');
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
