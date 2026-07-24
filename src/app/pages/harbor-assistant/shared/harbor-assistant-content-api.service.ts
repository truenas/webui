import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { harborAssistantBeaconApiUrl } from 'app/pages/harbor-assistant/services/harbor-assistant-api-prefix';
import { harborAssistantPreviewUrl } from 'app/pages/harbor-assistant/shared/harbor-assistant-results';
import {
  HarborAssistantCameraLiveSessionResponse,
  HarborAssistantHarborLinkCapabilitiesResponse,
  HarborAssistantSearchCameraStateResponse,
  HarborAssistantSearchDvrStatusResponse,
  HarborAssistantSearchDvrTimelineResponse,
  HarborAssistantSearchRequest,
  HarborAssistantSearchResponse,
  HarborAssistantSearchSnapshotTaskResponse,
} from 'app/pages/harbor-assistant/shared/harbor-assistant.interface';

@Injectable({ providedIn: 'root' })
export class HarborAssistantContentApiService {
  private readonly http = inject(HttpClient);
  private readonly requestIdSeed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  private requestSequence = 0;

  private apiUrl(path: string): string {
    return harborAssistantBeaconApiUrl(path);
  }

  search(
    payload: HarborAssistantSearchRequest,
  ): Observable<HarborAssistantSearchResponse> {
    return this.http.post<HarborAssistantSearchResponse>(
      this.apiUrl('/knowledge/search'),
      payload,
    );
  }

  cameraState(): Observable<HarborAssistantSearchCameraStateResponse> {
    return this.http.get<HarborAssistantSearchCameraStateResponse>(
      this.apiUrl('/state'),
    );
  }

  dvrStatus(): Observable<HarborAssistantSearchDvrStatusResponse> {
    return this.http.get<HarborAssistantSearchDvrStatusResponse>(
      this.apiUrl('/cameras/recordings/status'),
    );
  }

  dvrTimeline(
    deviceId?: string | null,
    from?: string | null,
    to?: string | null,
  ): Observable<HarborAssistantSearchDvrTimelineResponse> {
    const params = new URLSearchParams();
    if (deviceId) {
      params.set('device_id', deviceId);
    }
    if (from) {
      params.set('from', from);
    }
    if (to) {
      params.set('to', to);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.http.get<HarborAssistantSearchDvrTimelineResponse>(
      this.apiUrl(`/cameras/recordings/timeline${query}`),
    );
  }

  startDvrRecording(
    deviceId: string,
    streamProfile: 'sub' | 'main',
  ): Observable<HarborAssistantSearchDvrStatusResponse> {
    return this.http.post<HarborAssistantSearchDvrStatusResponse>(
      this.apiUrl(`/cameras/${encodeURIComponent(deviceId)}/recordings/start`),
      { stream_profile: streamProfile },
      this.mutationOptions('recording-start', deviceId),
    );
  }

  stopDvrRecording(
    deviceId: string,
  ): Observable<HarborAssistantSearchDvrStatusResponse> {
    return this.http.post<HarborAssistantSearchDvrStatusResponse>(
      this.apiUrl(`/cameras/${encodeURIComponent(deviceId)}/recordings/stop`),
      {},
      this.mutationOptions('recording-stop', deviceId),
    );
  }

  startCameraLiveSession(
    deviceId: string,
    streamProfile = 'sub',
  ): Observable<HarborAssistantCameraLiveSessionResponse> {
    return this.http.post<HarborAssistantCameraLiveSessionResponse>(
      this.apiUrl(`/cameras/${encodeURIComponent(deviceId)}/live/start`),
      { stream_profile: streamProfile },
      this.mutationOptions('live-start', deviceId),
    );
  }

  stopCameraLiveSession(
    deviceId: string,
    sessionId?: string | null,
  ): Observable<HarborAssistantCameraLiveSessionResponse> {
    return this.http.post<HarborAssistantCameraLiveSessionResponse>(
      this.apiUrl(`/cameras/${encodeURIComponent(deviceId)}/live/stop`),
      sessionId ? { session_id: sessionId } : {},
      this.mutationOptions('live-stop', `${deviceId}:${sessionId ?? 'current'}`),
    );
  }

  renewCameraLiveSession(
    deviceId: string,
    sessionId: string,
    ttlSeconds = 300,
  ): Observable<HarborAssistantCameraLiveSessionResponse> {
    return this.http.post<HarborAssistantCameraLiveSessionResponse>(
      this.apiUrl(`/cameras/${encodeURIComponent(deviceId)}/live/renew`),
      { session_id: sessionId, ttl_seconds: ttlSeconds },
      this.mutationOptions('live-renew', `${deviceId}:${sessionId}`),
    );
  }

  cameraLiveStatus(
    deviceId: string,
    sessionId?: string | null,
  ): Observable<HarborAssistantCameraLiveSessionResponse> {
    const query = sessionId
      ? `?session_id=${encodeURIComponent(sessionId)}`
      : '';
    return this.http.get<HarborAssistantCameraLiveSessionResponse>(
      this.apiUrl(
        `/cameras/${encodeURIComponent(deviceId)}/live/status${query}`,
      ),
    );
  }

  harborLinkCapabilities(): Observable<HarborAssistantHarborLinkCapabilitiesResponse> {
    return this.http.get<HarborAssistantHarborLinkCapabilitiesResponse>(
      this.apiUrl('/harbor-link/capabilities'),
    );
  }

  createSnapshotTask(
    deviceId: string,
  ): Observable<HarborAssistantSearchSnapshotTaskResponse> {
    return this.http.post<HarborAssistantSearchSnapshotTaskResponse>(
      this.apiUrl(`/cameras/${encodeURIComponent(deviceId)}/snapshot`),
      {},
      this.mutationOptions('snapshot', deviceId),
    );
  }

  private mutationOptions(operation: string, entity: string): { headers: Record<string, string> } {
    this.requestSequence += 1;
    return {
      headers: {
        'X-Request-Id': `webui:${operation}:${entity}:${this.requestIdSeed}:${this.requestSequence}`,
      },
    };
  }

  previewUrl(path: string): string {
    return harborAssistantPreviewUrl(path);
  }
}
