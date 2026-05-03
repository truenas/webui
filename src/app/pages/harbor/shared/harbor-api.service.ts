import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  HarborBotCameraStateResponse,
  HarborBotDvrStatusResponse,
  HarborBotDvrTimelineResponse,
  HarborBotSearchRequest,
  HarborBotSearchResponse,
  HarborBotSnapshotTaskResponse,
} from 'app/pages/harbor/shared/harbor.interface';
import { harborPreviewUrl } from 'app/pages/harbor/shared/harbor-results';

@Injectable({ providedIn: 'root' })
export class HarborApiService {
  private readonly http = inject(HttpClient);

  search(payload: HarborBotSearchRequest): Observable<HarborBotSearchResponse> {
    return this.http.post<HarborBotSearchResponse>('/api/harbordesk/knowledge/search', payload);
  }

  cameraState(): Observable<HarborBotCameraStateResponse> {
    return this.http.get<HarborBotCameraStateResponse>('/api/harbordesk/state');
  }

  dvrStatus(): Observable<HarborBotDvrStatusResponse> {
    return this.http.get<HarborBotDvrStatusResponse>('/api/harbordesk/cameras/recordings/status');
  }

  dvrTimeline(deviceId?: string | null, from?: string | null, to?: string | null): Observable<HarborBotDvrTimelineResponse> {
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
    return this.http.get<HarborBotDvrTimelineResponse>(`/api/harbordesk/cameras/recordings/timeline${query}`);
  }

  startDvrRecording(deviceId: string): Observable<HarborBotDvrStatusResponse> {
    return this.http.post<HarborBotDvrStatusResponse>(
      `/api/harbordesk/cameras/${encodeURIComponent(deviceId)}/recordings/start`,
      {},
    );
  }

  stopDvrRecording(deviceId: string): Observable<HarborBotDvrStatusResponse> {
    return this.http.post<HarborBotDvrStatusResponse>(
      `/api/harbordesk/cameras/${encodeURIComponent(deviceId)}/recordings/stop`,
      {},
    );
  }

  createSnapshotTask(deviceId: string): Observable<HarborBotSnapshotTaskResponse> {
    return this.http.post<HarborBotSnapshotTaskResponse>(`/api/harbordesk/cameras/${encodeURIComponent(deviceId)}/snapshot`, {});
  }

  previewUrl(path: string): string {
    return harborPreviewUrl(path);
  }
}
