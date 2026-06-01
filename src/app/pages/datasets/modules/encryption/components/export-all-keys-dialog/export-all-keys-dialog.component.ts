import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { TnDialogShellComponent } from '@truenas/ui-components';
import { Dataset } from 'app/interfaces/dataset.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-export-all-keys-dialog',
  templateUrl: './export-all-keys-dialog.component.html',
  styleUrls: ['./export-all-keys-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TranslateModule,
    FormActionsComponent,
    MatButton,
    TestDirective,
  ],
})
export class ExportAllKeysDialog {
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private loader = inject(LoaderService);
  private dialogRef = inject<DialogRef>(DialogRef);
  private download = inject(DownloadService);
  dataset = inject<Dataset>(DIALOG_DATA);
  private destroyRef = inject(DestroyRef);


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
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.dialogRef.close();
      });
  }
}
