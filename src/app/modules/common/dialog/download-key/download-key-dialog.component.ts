import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import helptext from 'app/helptext/storage/volumes/download-key';
import { AppLoaderService } from 'app/modules/app-loader/app-loader.service';
import { EntityUtils } from 'app/modules/entity/utils';
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
    private http: HttpClient,
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
      this.ws.call('core.download', ['pool.dataset.export_keys', [this.volumeName], this.fileName]).pipe(untilDestroyed(this)).subscribe((res) => {
        this.loader.close();
        const url = res[1];
        this.storage.streamDownloadFile(this.http, url, this.fileName, mimetype)
          .pipe(untilDestroyed(this))
          .subscribe((file) => {
            if (res !== null && (res as any) !== '') {
              this.storage.downloadBlob(file, this.fileName);
              this.isDownloaded = true;
            }
          });
      }, (error) => {
        this.loader.close();
        new EntityUtils().handleWsError(this, error, this.dialog);
      });
    } else {
      mimetype = 'application/octet-stream';
      this.ws.call('pool.download_encryption_key', payload).pipe(untilDestroyed(this)).subscribe((res) => {
        this.loader.close();
        this.storage.streamDownloadFile(this.http, res, this.fileName, mimetype)
          .pipe(untilDestroyed(this))
          .subscribe((file) => {
            if (res !== null && res !== '') {
              this.storage.downloadBlob(file, this.fileName);
              this.isDownloaded = true;
            }
          });
      }, () => {
        this.isDownloaded = true;
        this.loader.close();
      });
    }
  }
}
