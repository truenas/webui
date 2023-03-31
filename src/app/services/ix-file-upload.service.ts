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
  catchError, concatMap, tap, toArray,
} from 'rxjs/operators';
import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { ValidatedFile } from 'app/interfaces/validated-file.interface';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class IxFileUploadService {
  private readonly FILE_SIZE_LIMIT_50MB = 52428800;
  private fileUploadProgress$ = new Subject<HttpProgressEvent>();
  private fileUploadSuccess$ = new Subject<HttpResponse<unknown>>();

  private defaultUploadEndpoint: string;

  constructor(
    protected http: HttpClient,
    private translate: TranslateService,
    private authService: AuthService,
  ) {
    this.authService.authToken$.pipe(
      tap((token) => {
        this.defaultUploadEndpoint = '/_upload?auth_token=' + token;
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  upload(
    file: File,
    method: ApiMethod,
    params: unknown[] = [],
    apiEndPoint = this.defaultUploadEndpoint,
  ): void {
    const formData: FormData = new FormData();
    formData.append('data', JSON.stringify({
      method,
      params,
    }));
    formData.append('file', file, file.name);
    const req = new HttpRequest('POST', apiEndPoint, formData, {
      reportProgress: true,
    });

    this.http.request(req).pipe(untilDestroyed(this)).subscribe({
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

  // TODO: Consider moving error handling out of onUploading or consolidating everything in one method.
  get onUploading$(): Subject<HttpProgressEvent> {
    return this.fileUploadProgress$;
  }

  get onUploaded$(): Subject<HttpResponse<unknown>> {
    return this.fileUploadSuccess$;
  }

  validateScreenshots(screenshots: File[]): Observable<ValidatedFile[]> {
    return from(Array.from(screenshots)).pipe(
      concatMap((file: File): Observable<ValidatedFile> => {
        return this.validateScreenshot(file).pipe(
          catchError((error: ValidatedFile) => of(error)),
        );
      }),
      toArray(),
    );
  }

  validateScreenshot(file: File): Observable<ValidatedFile> {
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
