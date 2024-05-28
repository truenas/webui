import {
  HttpClient, HttpEvent, HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { MiB } from 'app/constants/bytes.constant';
import { ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { AuthService } from 'app/services/auth/auth.service';

const defaultFileSizeLimit = 50 * MiB;

@Injectable({
  providedIn: 'root',
})
export class IxFileUploadService {
  private fileSizeLimit = defaultFileSizeLimit;

  constructor(
    protected http: HttpClient,
    private authService: AuthService,
  ) {}

  /**
   * Reports progress.
   * You need to filter for `(event) => event instanceof HttpResponse` to wait for response.
   */
  upload(
    file: File,
    method: ApiJobMethod,
    params: unknown[] = [],
  ): Observable<HttpEvent<unknown>> {
    return this.authService.authToken$.pipe(
      take(1),
      map((token) => {
        const endPoint = '/_upload?auth_token=' + token;
        const formData = new FormData();
        formData.append('data', JSON.stringify({
          method,
          params,
        }));
        formData.append('file', file, file.name);
        return new HttpRequest('POST', endPoint, formData, {
          reportProgress: true,
        });
      }),
      switchMap((req) => this.http.request(req)),
    );
  }
}
