import {
  HttpClient, HttpEvent, HttpRequest, HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { ApiJobMethod, ApiJobResponse } from 'app/interfaces/api/api-job-directory.interface';
import { Job } from 'app/interfaces/job.interface';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { AuthService } from 'app/services/auth/auth.service';
import { AppState } from 'app/store';

export interface UploadOptions<M extends ApiJobMethod = ApiJobMethod> {
  file: File;
  method: M;
  params?: unknown[];
}

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  constructor(
    protected http: HttpClient,
    private authService: AuthService,
    private store$: Store<AppState>,
  ) {}

  /**
   * Reports progress.
   * You need to filter for `(event) => event instanceof HttpResponse` to wait for response.
   */
  upload(options: UploadOptions): Observable<HttpEvent<unknown>> {
    return this.authService.authToken$.pipe(
      take(1),
      map((token) => {
        const endPoint = '/_upload?auth_token=' + token;
        const formData = new FormData();
        formData.append('data', JSON.stringify({
          method: options.method,
          params: options.params || [],
        }));
        formData.append('file', options.file, options.file.name);
        return new HttpRequest('POST', endPoint, formData, {
          reportProgress: true,
        });
      }),
      switchMap((req) => this.http.request(req)),
    );
  }

  // TODO: This may be breaking levels of abstraction. Consider refactoring.
  uploadAsJob<M extends ApiJobMethod>(options: UploadOptions<M>): Observable<Job<ApiJobResponse<M>>> {
    return this.upload(options)
      .pipe(
        filter((event) => event instanceof HttpResponse),
        switchMap((response: HttpResponse<{ job_id: number }>) => {
          return this.store$.select(selectJob(response.body.job_id))
            .pipe(observeJob()) as Observable<Job<ApiJobResponse<M>>>;
        }),
      );
  }
}
