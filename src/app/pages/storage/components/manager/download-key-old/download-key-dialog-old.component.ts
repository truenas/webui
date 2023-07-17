import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import helptext from 'app/helptext/storage/volumes/download-key';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import {
  WebSocketService,
  StorageService, DialogService,
} from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  styleUrls: ['./download-key-dialog-old.component.scss'],
  templateUrl: './download-key-dialog-old.component.html',
})
export class DownloadKeyDialogOldComponent {
  new = false;
  volumeId: number;
  volumeName: string;
  fileName: string;
  isDownloaded = false;
  help = helptext;

  constructor(
    public dialogRef: MatDialogRef<DownloadKeyDialogOldComponent>,
    private ws: WebSocketService,
    private storage: StorageService,
    public dialog: DialogService,
    private loader: AppLoaderService,
    private errorHandler: ErrorHandlerService,
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
            .subscribe({
              next: (file) => {
                this.storage.downloadBlob(file, this.fileName);
                this.isDownloaded = true;
              },
              error: (error: HttpErrorResponse) => {
                this.dialog.error(this.errorHandler.parseHttpError(error));
              },
            });
        },
        error: (error: WebsocketError) => {
          this.loader.close();
          this.dialog.error(this.errorHandler.parseWsError(error));
        },
      });
    } else {
      mimetype = 'application/octet-stream';
      this.ws.call('pool.download_encryption_key', payload).pipe(untilDestroyed(this)).subscribe({
        next: (encryptionKey) => {
          this.loader.close();
          this.storage.streamDownloadFile(encryptionKey, this.fileName, mimetype)
            .pipe(untilDestroyed(this))
            .subscribe({
              next: (file) => {
                if (encryptionKey !== null && encryptionKey !== '') {
                  this.storage.downloadBlob(file, this.fileName);
                  this.isDownloaded = true;
                }
              },
              error: (error: HttpErrorResponse) => {
                this.dialog.error(this.errorHandler.parseHttpError(error));
              },
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
