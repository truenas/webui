import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import helptext from 'app/helptext/storage/volumes/download-key';
import { EntityUtils } from 'app/modules/entity/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import {
  WebSocketService,
  StorageService, DialogService,
} from 'app/services';

@UntilDestroy()
@Component({
  styleUrls: ['./download-key-dialog.component.scss'],
  templateUrl: './download-key-dialog.component.html',
})
export class DownloadKeyDialogComponent {
  new = false;
  volumeId: number;
  volumeName: string;
  fileName: string;
  isDownloaded = false;
  help = helptext;

  constructor(
    public dialogRef: MatDialogRef<DownloadKeyDialogComponent>,
    private ws: WebSocketService,
    private storage: StorageService,
    public dialog: DialogService,
    private loader: AppLoaderService,
  ) { }

  downloadKey(): void {
    const payload: [volumeId: number, fileName?: string] = [this.volumeId];
    if (this.fileName !== undefined) {
      payload.push(this.fileName);
    }
    let mimetype: string;
    this.loader.open();
    if (this.new) { // new is ZoL encryption
      mimetype = 'application/json';
      this.ws.call('core.download', ['pool.dataset.export_keys', [this.volumeName], this.fileName]).pipe(untilDestroyed(this)).subscribe({
        next: ([, url]) => {
          this.loader.close();
          this.storage.streamDownloadFile(url, this.fileName, mimetype)
            .pipe(untilDestroyed(this))
            .subscribe((file) => {
              this.storage.downloadBlob(file, this.fileName);
              this.isDownloaded = true;
            });
        },
        error: (error) => {
          this.loader.close();
          new EntityUtils().handleWsError(this, error, this.dialog);
        },
      });
    } else {
      mimetype = 'application/octet-stream';
      this.ws.call('pool.download_encryption_key', payload).pipe(untilDestroyed(this)).subscribe({
        next: (encryptionKey) => {
          this.loader.close();
          this.storage.streamDownloadFile(encryptionKey, this.fileName, mimetype)
            .pipe(untilDestroyed(this))
            .subscribe((file) => {
              if (encryptionKey !== null && encryptionKey !== '') {
                this.storage.downloadBlob(file, this.fileName);
                this.isDownloaded = true;
              }
            });
        },
        error: () => {
          this.isDownloaded = true;
          this.loader.close();
        },
      });
    }
  }
}
