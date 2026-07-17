import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  HarborAssistantCameraLiveSessionResponse,
  HarborAssistantKnowledgeAnswerResponse,
  HarborAssistantSearchCameraStateResponse,
  HarborAssistantSearchDvrStatusResponse,
  HarborAssistantSearchDvrTimelineResponse,
  HarborAssistantSearchRequest,
  HarborAssistantSearchResponse,
  HarborAssistantSearchSnapshotTaskResponse,
} from 'app/pages/harbor-assistant/shared/harbor-assistant.interface';
import { harborAssistantPreviewUrl } from 'app/pages/harbor-assistant/shared/harbor-assistant-results';
import { harborAssistantBeaconApiUrl } from 'app/pages/harbor-assistant/services/harbor-assistant-api-prefix';

@Injectable({ providedIn: 'root' })
export class HarborAssistantContentApiService {
  private readonly http = inject(HttpClient);

  private apiUrl(path: string): string {
    return harborAssistantBeaconApiUrl(path);
  }

  search(payload: HarborAssistantSearchRequest): Observable<HarborAssistantSearchResponse> {
    return this.http.post<HarborAssistantKnowledgeAnswerResponse>(this.apiUrl('/knowledge/answer'), payload).pipe(
      map((response) => ({
        ...response.search,
        answer: response.answer,
        answer_degraded: response.degraded,
        answer_degraded_reason: response.degraded_reason,
        answer_intent: response.query_understanding?.intent ?? null,
        warnings: [...new Set([...response.search.warnings, ...response.warnings])],
      })),
    );
  }

  cameraState(): Observable<HarborAssistantSearchCameraStateResponse> {
    return this.http.get<HarborAssistantSearchCameraStateResponse>(this.apiUrl('/state'));
  }

  dvrStatus(): Observable<HarborAssistantSearchDvrStatusResponse> {
    return this.http.get<HarborAssistantSearchDvrStatusResponse>(this.apiUrl('/cameras/recordings/status'));
  }

  dvrTimeline(deviceId?: string | null, from?: string | null, to?: string | null): Observable<HarborAssistantSearchDvrTimelineResponse> {
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
    return this.http.get<HarborAssistantSearchDvrTimelineResponse>(this.apiUrl(`/cameras/recordings/timeline${query}`));
  }

  startDvrRecording(deviceId: string): Observable<HarborAssistantSearchDvrStatusResponse> {
    return this.http.post<HarborAssistantSearchDvrStatusResponse>(
      this.apiUrl(`/cameras/${encodeURIComponent(deviceId)}/recordings/start`),
      {},
    );
  }

  stopDvrRecording(deviceId: string): Observable<HarborAssistantSearchDvrStatusResponse> {
    return this.http.post<HarborAssistantSearchDvrStatusResponse>(
      this.apiUrl(`/cameras/${encodeURIComponent(deviceId)}/recordings/stop`),
      {},
    );
  }

  startCameraLiveSession(deviceId: string): Observable<HarborAssistantCameraLiveSessionResponse> {
    return this.http.post<HarborAssistantCameraLiveSessionResponse>(
      this.apiUrl(`/cameras/${encodeURIComponent(deviceId)}/live/start`),
      {},
    );
  }

  stopCameraLiveSession(deviceId: string, sessionId?: string | null): Observable<HarborAssistantCameraLiveSessionResponse> {
    return this.http.post<HarborAssistantCameraLiveSessionResponse>(
      this.apiUrl(`/cameras/${encodeURIComponent(deviceId)}/live/stop`),
      sessionId ? { session_id: sessionId } : {},
    );
  }

  cameraLiveStatus(deviceId: string, sessionId?: string | null): Observable<HarborAssistantCameraLiveSessionResponse> {
    const query = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : '';
    return this.http.get<HarborAssistantCameraLiveSessionResponse>(
      this.apiUrl(`/cameras/${encodeURIComponent(deviceId)}/live/status${query}`),
    );
  }

  createSnapshotTask(deviceId: string): Observable<HarborAssistantSearchSnapshotTaskResponse> {
    return this.http.post<HarborAssistantSearchSnapshotTaskResponse>(this.apiUrl(`/cameras/${encodeURIComponent(deviceId)}/snapshot`), {});
  }

  previewUrl(path: string): string {
    return harborAssistantPreviewUrl(path);
  }
}
