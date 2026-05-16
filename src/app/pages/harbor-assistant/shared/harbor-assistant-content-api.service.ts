import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  HarborAssistantSearchCameraStateResponse,
  HarborAssistantSearchDvrStatusResponse,
  HarborAssistantSearchDvrTimelineResponse,
  HarborAssistantSearchRequest,
  HarborAssistantSearchResponse,
  HarborAssistantSearchSnapshotTaskResponse,
} from 'app/pages/harbor-assistant/shared/harbor-assistant.interface';
import { harborAssistantPreviewUrl } from 'app/pages/harbor-assistant/shared/harbor-assistant-results';

@Injectable({ providedIn: 'root' })
export class HarborAssistantContentApiService {
  private readonly http = inject(HttpClient);

  search(payload: HarborAssistantSearchRequest): Observable<HarborAssistantSearchResponse> {
    return this.http.post<HarborAssistantSearchResponse>('/api/harbor-beacon/knowledge/search', payload);
  }

  cameraState(): Observable<HarborAssistantSearchCameraStateResponse> {
    return this.http.get<HarborAssistantSearchCameraStateResponse>('/api/harbor-beacon/state');
  }

  dvrStatus(): Observable<HarborAssistantSearchDvrStatusResponse> {
    return this.http.get<HarborAssistantSearchDvrStatusResponse>('/api/harbor-beacon/cameras/recordings/status');
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
    return this.http.get<HarborAssistantSearchDvrTimelineResponse>(`/api/harbor-beacon/cameras/recordings/timeline${query}`);
  }

  startDvrRecording(deviceId: string): Observable<HarborAssistantSearchDvrStatusResponse> {
    return this.http.post<HarborAssistantSearchDvrStatusResponse>(
      `/api/harbor-beacon/cameras/${encodeURIComponent(deviceId)}/recordings/start`,
      {},
    );
  }

  stopDvrRecording(deviceId: string): Observable<HarborAssistantSearchDvrStatusResponse> {
    return this.http.post<HarborAssistantSearchDvrStatusResponse>(
      `/api/harbor-beacon/cameras/${encodeURIComponent(deviceId)}/recordings/stop`,
      {},
    );
  }

  createSnapshotTask(deviceId: string): Observable<HarborAssistantSearchSnapshotTaskResponse> {
    return this.http.post<HarborAssistantSearchSnapshotTaskResponse>(`/api/harbor-beacon/cameras/${encodeURIComponent(deviceId)}/snapshot`, {});
  }

  previewUrl(path: string): string {
    return harborAssistantPreviewUrl(path);
  }
}
