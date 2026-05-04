import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';

@Injectable({
  providedIn: 'root',
})
export class GlobalApiHttpService {
  private http = inject(HttpClient);
  private window = inject<Window>(WINDOW);

  private readonly baseUrl: string;

  constructor() {
    const protocol = this.window.location.protocol === 'https:' ? 'https://' : 'http://';
    this.baseUrl = environment.production ? `${protocol}${environment.remote}/api` : '/api';
  }

  private get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${path}`);
  }

  getBootId(): Observable<string> {
    return this.get<string>('boot_id');
  }
}
