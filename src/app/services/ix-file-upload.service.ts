import {
  HttpClient, HttpErrorResponse, HttpEvent, HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class IxFileUploadService {
  private fileUpload$ = new Subject<unknown>();

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
      this.fileUpload$.next(event);
    },
    (error: HttpErrorResponse) => {
      this.fileUpload$.error(error);
    });
  }

  get onUpload$(): Subject<unknown> {
    return this.fileUpload$;
  }
}
