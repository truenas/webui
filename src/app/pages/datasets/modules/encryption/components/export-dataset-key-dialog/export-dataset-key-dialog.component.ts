import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { TnDialogShellComponent } from '@truenas/ui-components';
import { JobState } from 'app/enums/job-state.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-export-dataset-key-dialog',
  templateUrl: './export-dataset-key-dialog.component.html',
  styleUrls: ['./export-dataset-key-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TranslateModule,
    FormActionsComponent,
    MatButton,
    TestDirective,
  ],
})
export class ExportDatasetKeyDialog implements OnInit {
  private api = inject(ApiService);
  private loader = inject(LoaderService);
  private errorHandler = inject(ErrorHandlerService);
  private dialogRef = inject<DialogRef>(DialogRef);
  private download = inject(DownloadService);
  private cdr = inject(ChangeDetectorRef);
  dataset = inject<Dataset>(DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  key: string;

  ngOnInit(): void {
    this.loadKey();
  }

  onDownload(): void {
    const fileName = `dataset_${this.dataset.name}_key.json`;

    this.download.coreDownload({
      fileName,
      method: 'pool.dataset.export_key',
      arguments: [this.dataset.id, true],
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

  private loadKey(): void {
    this.api.job('pool.dataset.export_key', [this.dataset.id])
      .pipe(this.loader.withLoader(), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (job) => {
          if (job.state === JobState.Failed) {
            this.errorHandler.showErrorModal(job);
          } else if (job.state !== JobState.Success) {
            return;
          }
          this.key = job.result;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.dialogRef.close();
          this.errorHandler.showErrorModal(error);
        },
      });
  }
}
