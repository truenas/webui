import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { switchMap, take } from 'rxjs/operators';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { FileRecord } from 'app/interfaces/file-record.interface';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';

export interface QuickLookDialogData {
  fileItem: FileRecord;
}

@Component({
  selector: 'ix-quick-look-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatProgressSpinnerModule,
    TranslateModule,
    TnIconComponent,
  ],
  templateUrl: './quick-look-dialog.component.html',
  styleUrls: ['./quick-look-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickLookDialogComponent implements OnInit, OnDestroy {
  private dialogRef = inject<MatDialogRef<QuickLookDialogComponent>>(MatDialogRef);
  data = inject<QuickLookDialogData>(MAT_DIALOG_DATA);
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private store$ = inject<Store<AppState>>(Store);

  isLoading = signal<boolean>(true);
  mediaUrl = signal<string | null>(null);
  error = signal<string | null>(null);
  isVideo = signal<boolean>(false);

  private objectUrl: string | null = null;

  ngOnInit(): void {
    this.loadMedia();
  }

  ngOnDestroy(): void {
    // Clean up object URL to prevent memory leaks
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  @HostListener('document:keydown.space')
  @HostListener('document:keydown.escape')
  onKeydown(): void {
    this.close();
  }

  close(): void {
    this.dialogRef.close();
  }

  private loadMedia(): void {
    const filePath = this.data.fileItem.path;
    const fileName = this.data.fileItem.name;
    const mimeType = this.getMimeType(fileName);

    // Check if this is a video file
    this.isVideo.set(mimeType.startsWith('video/'));

    this.api.call('core.download', ['filesystem.get', [filePath], fileName])
      .pipe(
        switchMap(([jobId, url]) => {
          return this.store$.select(selectJob(jobId)).pipe(
            observeJob(),
            take(1),
            switchMap(() => this.http.post(url, '', { responseType: 'blob' })),
          );
        }),
      )
      .subscribe({
        next: (blob) => {
          const typedBlob = new Blob([blob], { type: mimeType });
          this.objectUrl = URL.createObjectURL(typedBlob);
          this.mediaUrl.set(this.objectUrl);
          this.isLoading.set(false);
        },
        error: (err: unknown) => {
          console.error('Failed to load media:', err);
          this.error.set('Failed to load media');
          this.isLoading.set(false);
        },
      });
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    const mimeTypes: Record<string, string> = {
      // Image types
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      webp: 'image/webp',
      bmp: 'image/bmp',
      ico: 'image/x-icon',
      // Video types
      mp4: 'video/mp4',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }
}
