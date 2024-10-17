import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { switchMap } from 'rxjs/operators';
import { Dataset } from 'app/interfaces/dataset.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-export-all-keys-dialog',
  templateUrl: './export-all-keys-dialog.component.html',
  styleUrls: ['./export-all-keys-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    TranslateModule,
    MatDialogContent,
    FormActionsComponent,
    MatDialogActions,
    MatButton,
    TestDirective,
    MatDialogClose,
  ],
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
