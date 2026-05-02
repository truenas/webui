import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  HarborBotSearchRequest,
  HarborBotSearchResponse,
} from 'app/pages/harborbot/interfaces/harborbot.interface';
import { harborBotPreviewUrl } from 'app/pages/harborbot/utils/harborbot-results';

@Injectable({ providedIn: 'root' })
export class HarborBotApiService {
  private readonly http = inject(HttpClient);

  search(payload: HarborBotSearchRequest): Observable<HarborBotSearchResponse> {
    return this.http.post<HarborBotSearchResponse>('/api/harbordesk/knowledge/search', payload);
  }

  previewUrl(path: string): string {
    return harborBotPreviewUrl(path);
  }
}
