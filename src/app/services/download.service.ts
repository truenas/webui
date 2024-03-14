import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DownloadService {
  constructor(protected http: HttpClient) {}

  downloadFile(filename: string, contents: string, mimeType = 'text/plain'): void {
    const byteCharacters = atob(contents);

    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);

    const blob = new Blob([byteArray], { type: mimeType });

    this.downloadBlob(blob, filename);
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
