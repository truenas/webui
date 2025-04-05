import {
  HttpClient, HttpEvent, HttpProgressEvent, HttpRequest, HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { ApiJobMethod, ApiJobResponse } from 'app/interfaces/api/api-job-directory.interface';
import { Job } from 'app/interfaces/job.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
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
    private translate: TranslateService,
    private authService: AuthService,
    private store$: Store<AppState>,
  ) {}

  /**
   * Reports progress.
   * You need to filter for `(event) => event instanceof HttpResponse` to wait for response.
   */
  upload(options: UploadOptions): Observable<HttpEvent<unknown>> {
    return this.authService.getOneTimeToken().pipe(
      take(1),
      map((token) => {
        const endPoint = `/_upload?auth_token=${token}`;
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
        switchMap((response: HttpResponse<{ job_id: number }> | HttpProgressEvent) => {
          if (response instanceof HttpResponse) {
            const jobId = response.body?.job_id;
            if (!jobId) {
              throw new Error('Job ID not found in response');
            }
            return this.store$.select(selectJob(jobId))
              .pipe(observeJob()) as Observable<Job<ApiJobResponse<M>>>;
          }

          const fakeJob: Job<ApiJobResponse<M>> = {
            progress: {
              percent: response.loaded && response.total ? response.loaded / response.total * 100 : 0,
              description: this.translate.instant('Uploading'),
            },
            method: options.method,
            state: JobState.Running,
          } as Job<ApiJobResponse<M>>;

          return of(fakeJob);
        }),
      );
  }
}
