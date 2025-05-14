import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable, of } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';

@Injectable({
  providedIn: 'root',
})
export class GlobalApiHttpService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    @Inject(WINDOW) private window: Window,
  ) {
    const protocol = this.window.location.protocol === 'https:' ? 'https://' : 'http://';
    this.baseUrl = environment.production ? `${protocol}${environment.remote}/api` : '/api';
  }

  private get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${path}`);
  }

  getBootId(): Observable<string> {
    // return this.get<string>('boot_id');
    return of('12345678-1234-1234-1234-123456789012');
  }
}
