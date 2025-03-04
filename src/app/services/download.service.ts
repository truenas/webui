import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, switchMap } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';

interface CoreDownloadParams {
  method: string;
  arguments: unknown;
  fileName: string;
  mimeType: string;
}

@Injectable({
  providedIn: 'root',
})
export class DownloadService {
  constructor(
    protected http: HttpClient,
    private api: ApiService,
    private store$: Store<AppState>,
  ) {}

  coreDownload(params: CoreDownloadParams): Observable<Blob> {
    return this.api.call('core.download', [params.method, params.arguments, params.fileName]).pipe(
      switchMap(([jobId, url]) => {
        return this.store$.select(selectJob(jobId)).pipe(
          observeJob(),
          switchMap(() => {
            return this.downloadUrl(url, params.fileName, params.mimeType);
          }),
        );
      }),
    );
  }

  downloadText(contents: string, filename: string): void {
    const blob = new Blob([contents], { type: 'text/plain' });
    this.downloadBlob(blob, filename);
  }

  downloadBlob(blob: Blob, filename: string): void {
    const anchor = document.createElement('a');
    document.body.appendChild(anchor);
    anchor.download = filename;
    anchor.href = URL.createObjectURL(blob);
    anchor.onclick = () => {
      // revokeObjectURL needs a delay to work properly
      setTimeout(() => {
        URL.revokeObjectURL(anchor.href);
      }, 1500);
    };

    anchor.click();
    anchor.remove();
  }

  streamDownloadFile(url: string, filename: string, mimeType: string): Observable<Blob> {
    return this.http.post(url, '', { responseType: 'blob' }).pipe(
      map(
        (blob) => {
          return new Blob([blob], { type: mimeType });
        },
      ),
    );
  }

  downloadUrl(url: string, filename: string, mimeType: string): Observable<Blob> {
    return this.streamDownloadFile(url, filename, mimeType).pipe(
      tap((blob) => this.downloadBlob(blob, filename)),
    );
  }
}
