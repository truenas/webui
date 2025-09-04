import {
  HttpEvent, HttpEventType, HttpProgressEvent, HttpResponse,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
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
  onCancel?: () => void;
}

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private translate = inject(TranslateService);
  private authService = inject(AuthService);
  private store$ = inject<Store<AppState>>(Store);

  /**
   * Creates a cancellable upload with access to the underlying XMLHttpRequest
   */
  upload(options: UploadOptions): {
    observable: Observable<HttpEvent<unknown>>;
    cancel: () => void;
  } {
    let xhr: XMLHttpRequest | null = null;

    const observable$ = this.authService.getOneTimeToken().pipe(
      take(1),
      switchMap((token) => {
        return new Observable<HttpEvent<unknown>>((observer) => {
          const endPoint = `/_upload?auth_token=${token}`;
          const formData = new FormData();
          formData.append('data', JSON.stringify({
            method: options.method,
            params: options.params || [],
          }));
          formData.append('file', options.file, options.file.name);

          xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              observer.next({
                type: HttpEventType.UploadProgress,
                loaded: event.loaded,
                total: event.total,
              } as HttpProgressEvent);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr && xhr.status >= 200 && xhr.status < 300) {
              try {
                const responseText = xhr.responseText || '{}';
                const response = responseText ? JSON.parse(responseText) : null;
                observer.next(new HttpResponse({
                  status: xhr.status,
                  statusText: xhr.statusText,
                  body: response,
                }));
                observer.complete();
              } catch (error) {
                observer.error(error);
              }
            } else {
              observer.error(new Error(`HTTP ${xhr?.status}: ${xhr?.statusText}`));
            }
          });

          xhr.addEventListener('error', () => {
            observer.error(new Error(`Upload failed: ${xhr?.statusText || 'Unknown error'}`));
          });

          xhr.addEventListener('abort', () => {
            observer.error(new DOMException('Upload cancelled', 'AbortError'));
          });

          xhr.open('POST', endPoint);
          xhr.send(formData);
        });
      }),
    );

    const cancel = (): void => {
      if (xhr) {
        xhr.abort();
        xhr = null;
      }
      if (options.onCancel) {
        options.onCancel();
      }
    };

    return { observable: observable$, cancel };
  }

  uploadAsJob<M extends ApiJobMethod>(options: UploadOptions<M>): Observable<Job<ApiJobResponse<M>>> {
    const { observable: observable$ } = this.upload(options);
    return observable$
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
              description: this.translate.instant('Uploading') as string,
            },
            method: options.method,
            state: JobState.Running,
          } as Job<ApiJobResponse<M>>;

          return of(fakeJob);
        }),
      );
  }
}
