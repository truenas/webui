import {
  HttpClient, HttpEvent, HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  from, Observable, Observer, of,
} from 'rxjs';
import {
  catchError, concatMap, map, switchMap, take, toArray,
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

  constructor(
    protected http: HttpClient,
    private ws: WebSocketService,
    private translate: TranslateService,
    private authService: AuthService,
  ) {
    this.getSystemFileSizeLimit();
  }

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

  validateImages(screenshots: File[]): Observable<ValidatedFile[]> {
    return from(screenshots).pipe(
      take(screenshots.length),
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

  // TODO: Potential race condition.
  private getSystemFileSizeLimit(): void {
    this.ws.call('support.attach_ticket_max_size').subscribe((size) => {
      this.fileSizeLimit = size * MiB;
    });
  }
}
