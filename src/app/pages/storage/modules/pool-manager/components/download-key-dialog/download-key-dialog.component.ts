import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject,
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EMPTY, switchMap } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import helptext from 'app/helptext/storage/volumes/download-key';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import {
  AppLoaderService, DialogService, StorageService, WebSocketService,
} from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';

export type DownloadKeyDialogParams = {
  id: number;
  name: string;
};

@UntilDestroy()
@Component({
  templateUrl: './download-key-dialog.component.html',
  styleUrls: ['./download-key-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DownloadKeyDialogComponent {
  protected helptext = helptext;
  protected wasDownloaded = false;

  private filename: string;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    private storage: StorageService,
    private dialog: DialogService,
    @Inject(MAT_DIALOG_DATA) private data: DownloadKeyDialogParams,
  ) {
    this.filename = `dataset_${this.data.name}_keys.json`;
  }

  downloadKey(): void {
    this.loader.open();
    this.ws.call('core.download', ['pool.dataset.export_keys', [this.data.name], this.filename]).pipe(
      switchMap(([, url]) => {
        return this.storage.streamDownloadFile(url, this.filename, 'application/json').pipe(
          tap((file) => {
            this.storage.downloadBlob(file, this.filename);
            this.wasDownloaded = true;
            this.cdr.markForCheck();
            this.loader.close();
          }),
          catchError((error) => {
            this.loader.close();
            this.dialog.error(this.errorHandler.parseHttpError(error));
            return EMPTY;
          }),
        );
      }),
      untilDestroyed(this),
    ).subscribe({
      error: (error: WebsocketError) => {
        this.loader.close();
        this.dialog.error(this.errorHandler.parseWsError(error));
      },
    });
  }
}
