import {
  HttpClient, HttpErrorResponse, HttpEvent, HttpEventType, HttpProgressEvent, HttpRequest, HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  from, Observable, Observer, of, Subject,
} from 'rxjs';
import {
  catchError, concatMap, map, switchMap, take, toArray,
} from 'rxjs/operators';
import { MiB } from 'app/constants/bytes.constant';
import { ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { ValidatedFile } from 'app/interfaces/validated-file.interface';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class IxFileUploadService {
  private readonly FILE_SIZE_LIMIT_50MB = 50 * MiB;
  private fileUploadProgress$ = new Subject<HttpProgressEvent>();
  private fileUploadSuccess$ = new Subject<HttpResponse<unknown>>();

  constructor(
    protected http: HttpClient,
    private translate: TranslateService,
    private authService: AuthService,
  ) { }

  /**
   * @deprecated Use upload2 instead.
   */
  upload(
    file: File,
    method: ApiJobMethod,
    params: unknown[] = [],
  ): void {
    this.authService.authToken$.pipe(
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
      untilDestroyed(this),
    ).subscribe({
      next: (event: HttpEvent<unknown>) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.fileUploadProgress$.next(event);
        } else if (event instanceof HttpResponse && event.statusText === 'OK') {
          this.fileUploadSuccess$.next(event);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.fileUploadProgress$.error(error);
      },
    });
  }

  /**
   * Reports progress.
   * You need to filter for `(event) => event instanceof HttpResponse` to wait for response.
   */
  upload2(
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

  /**
   * @deprecated Use upload2.
   */
  get onUploading$(): Subject<HttpProgressEvent> {
    return this.fileUploadProgress$;
  }

  /**
   * @deprecated Use upload2.
   */
  get onUploaded$(): Subject<HttpResponse<unknown>> {
    return this.fileUploadSuccess$;
  }

  validateImages(screenshots: File[]): Observable<ValidatedFile[]> {
    return from(Array.from(screenshots)).pipe(
      concatMap((file: File): Observable<ValidatedFile> => {
        return this.validateImage(file).pipe(
          catchError((error: ValidatedFile) => of(error)),
        );
      }),
      toArray(),
    );
  }

  validateImage(file: File): Observable<ValidatedFile> {
    const fileReader = new FileReader();
    const { type, name, size } = file;
    return new Observable((observer: Observer<ValidatedFile>) => {
      const isValidSize = size <= this.FILE_SIZE_LIMIT_50MB;
      if (!isValidSize) {
        observer.error({ error: { name, errorMessage: this.translate.instant('File size is limited to 50 MiB.') } });
      }

      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        if (type.startsWith('image/')) {
          const image = new Image();
          image.onload = () => {
            observer.next({ file });
            observer.complete();
          };
          image.onerror = () => {
            observer.error({ error: { name, errorMessage: this.translate.instant('Invalid image') } });
          };
          image.src = fileReader.result as string;
        } else {
          observer.next({ file });
          observer.complete();
        }
      };
      fileReader.onerror = () => {
        observer.error({ error: { name, errorMessage: this.translate.instant('Invalid file') } });
      };
    });
  }
}
