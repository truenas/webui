import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Dataset } from 'app/interfaces/dataset.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

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
export class ExportAllKeysDialog {
  constructor(
    private errorHandler: ErrorHandlerService,
    private api: ApiService,
    private loader: LoaderService,
    private dialogRef: MatDialogRef<ExportAllKeysDialog>,
    private download: DownloadService,
    @Inject(MAT_DIALOG_DATA) public dataset: Dataset,
  ) { }

  onDownload(): void {
    const fileName = 'dataset_' + this.dataset.name + '_keys.json';
    this.download.coreDownload({
      fileName,
      method: 'pool.dataset.export_keys',
      arguments: [this.dataset.name],
      mimeType: 'application/json',
    })
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.dialogRef.close();
      });
  }
}
