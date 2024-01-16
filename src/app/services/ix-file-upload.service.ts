import {
  HttpClient, HttpEventType, HttpProgressEvent, HttpRequest, HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  from, Observable, Observer, of, Subject, throwError,
} from 'rxjs';
import {
  catchError, concatMap, map, switchMap, take, tap, toArray,
} from 'rxjs/operators';
import { MiB } from 'app/constants/bytes.constant';
import { ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { ValidatedFile } from 'app/interfaces/validated-file.interface';
import { AuthService } from 'app/services/auth/auth.service';
import { WebSocketService } from 'app/services/ws.service';

const defaultFileSizeLimit = 50 * MiB;

@Injectable({
  providedIn: 'root',
})
export class IxFileUploadService {
  private fileSizeLimit = defaultFileSizeLimit;
  private fileUploadProgress$ = new Subject<HttpProgressEvent>();
  private fileUploadSuccess$ = new Subject<HttpResponse<unknown>>();

  constructor(
    protected http: HttpClient,
    private ws: WebSocketService,
    private translate: TranslateService,
    private authService: AuthService,
  ) {
    this.getSystemFileSizeLimit();
  }

  upload(
    file: File,
    method: ApiJobMethod,
    params: unknown[] = [],
  ): Observable<unknown> {
    return this.authService.authToken$.pipe(
      take(1),
      map((token) => {
        const endPoint = '/_upload?auth_token=' + token;
        const formData = new FormData();
        formData.append('data', JSON.stringify({ method, params }));
        formData.append('file', file, file.name);
        return new HttpRequest('POST', endPoint, formData, {
          reportProgress: true,
        });
      }),
      switchMap((req) => this.http.request(req)),
      tap((event) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.fileUploadProgress$.next(event);
        } else if (event instanceof HttpResponse && event.statusText === 'OK') {
          this.fileUploadSuccess$.next(event);
        }
      }),
      catchError((error) => {
        this.fileUploadProgress$.error(error);
        return throwError(() => error);
      }),
    );
  }

  // TODO: Consider moving error handling out of onUploading or consolidating everything in one method.
  get onUploading$(): Subject<HttpProgressEvent> {
    return this.fileUploadProgress$;
  }

  get onUploaded$(): Subject<HttpResponse<unknown>> {
    return this.fileUploadSuccess$;
  }

  validateScreenshots(screenshots: File[]): Observable<ValidatedFile[]> {
    return from(screenshots).pipe(
      take(screenshots.length),
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
      const isValidSize = size <= this.fileSizeLimit;
      if (!isValidSize) {
        observer.error({
          error: {
            name,
            errorMessage: this.translate.instant('File size is limited to {n} MiB.', { n: this.fileSizeLimit / MiB }),
          },
        });
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

  private getSystemFileSizeLimit(): void {
    this.ws.call('support.attach_ticket_max_size').subscribe((size) => {
      this.fileSizeLimit = size * MiB;
    });
  }
}
