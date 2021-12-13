import {
  HttpClient, HttpErrorResponse, HttpEvent, HttpEventType, HttpProgressEvent, HttpRequest, HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class IxFileUploadService {
  private fileUploadProgress$ = new Subject<HttpProgressEvent | HttpErrorResponse>();
  private fileUploadSuccess$ = new Subject<HttpResponse<unknown>>();

  constructor(
    protected http: HttpClient,
  ) {}

  upload(
    filelist: FileList,
    method: string,
    params: [
      mountpoint: string,
      payload: { [key: string]: any },
    ],
    apiEndPoint: string,
  ): void {
    const formData: FormData = new FormData();
    formData.append('data', JSON.stringify({
      method,
      params,
    }));
    if (filelist) {
      for (const file of Array.from(filelist)) {
        formData.append('file', file);
      }
    }
    const req = new HttpRequest('POST', apiEndPoint, formData, {
      reportProgress: true,
    });

    this.http.request(req).pipe(untilDestroyed(this)).subscribe((event: HttpEvent<unknown>) => {
      if (event.type === HttpEventType.UploadProgress) {
        this.fileUploadProgress$.next(event);
      } else if (event instanceof HttpResponse) {
        if (event.statusText === 'OK') {
          this.fileUploadSuccess$.next(event);
        }
      }
    },
    (error: HttpErrorResponse) => {
      this.fileUploadProgress$.error(error);
    });
  }

  get onUploading$(): Subject<HttpProgressEvent | HttpErrorResponse> {
    return this.fileUploadProgress$;
  }

  get onUploaded$(): Subject<HttpResponse<unknown>> {
    return this.fileUploadSuccess$;
  }
}
