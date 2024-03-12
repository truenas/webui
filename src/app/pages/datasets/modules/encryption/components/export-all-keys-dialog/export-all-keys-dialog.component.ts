import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { switchMap } from 'rxjs/operators';
import { Dataset } from 'app/interfaces/dataset.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

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
    private download: DownloadService,
    @Inject(MAT_DIALOG_DATA) public dataset: Dataset,
  ) { }

  onDownload(): void {
    const fileName = 'dataset_' + this.dataset.name + '_keys.json';
    const mimetype = 'application/json';
    this.ws.call('core.download', ['pool.dataset.export_keys', [this.dataset.name], fileName])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        switchMap(([, url]) => this.download.downloadUrl(url, fileName, mimetype)),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.dialogRef.close();
      });
  }
}
