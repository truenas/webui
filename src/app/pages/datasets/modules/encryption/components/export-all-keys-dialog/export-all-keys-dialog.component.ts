import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { switchMap } from 'rxjs/operators';
import { Dataset } from 'app/interfaces/dataset.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import {
  AppLoaderService, DialogService, StorageService, WebSocketService,
} from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  templateUrl: './export-all-keys-dialog.component.html',
  styleUrls: ['./export-all-keys-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportAllKeysDialogComponent {
  constructor(
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private dialogRef: MatDialogRef<ExportAllKeysDialogComponent>,
    private dialogService: DialogService,
    private storageService: StorageService,
    @Inject(MAT_DIALOG_DATA) public dataset: Dataset,
  ) { }

  onDownload(): void {
    const fileName = 'dataset_' + this.dataset.name + '_keys.json';
    const mimetype = 'application/json';
    this.loader.open();
    this.ws.call('core.download', ['pool.dataset.export_keys', [this.dataset.name], fileName])
      .pipe(
        switchMap(([, url]) => this.storageService.downloadUrl(url, fileName, mimetype)),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => {
          this.loader.close();
          this.dialogRef.close();
        },
        error: (error: WebsocketError) => {
          this.loader.close();
          this.dialogService.error(this.errorHandler.parseWsError(error));
        },
      });
  }
}
