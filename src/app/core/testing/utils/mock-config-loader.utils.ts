import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

export class MockConfigLoader {
  constructor(private http: HttpClient) {}
  getMockConfig(): Observable<unknown> {
    return loadMockConfig(this.http);
  }
}

export function loadMockConfig(http: HttpClient): Observable<unknown> {
  const url = 'assets/mock/configs/' + environment.mockConfig;
  return http.get(url);
}
