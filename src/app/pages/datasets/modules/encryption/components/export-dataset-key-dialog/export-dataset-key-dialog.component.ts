import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { JobState } from 'app/enums/job-state.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-export-dataset-key-dialog',
  templateUrl: './export-dataset-key-dialog.component.html',
  styleUrls: ['./export-dataset-key-dialog.component.scss'],
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
export class ExportDatasetKeyDialogComponent implements OnInit {
  key: string;

  constructor(
    private api: ApiService,
    private loader: LoaderService,
    private errorHandler: ErrorHandlerService,
    private dialogRef: MatDialogRef<ExportDatasetKeyDialogComponent>,
    private dialogService: DialogService,
    private download: DownloadService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public dataset: Dataset,
  ) { }

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
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.dialogRef.close();
      });
  }

  private loadKey(): void {
    this.api.job('pool.dataset.export_key', [this.dataset.id])
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: (job) => {
          if (job.state === JobState.Failed) {
            this.dialogService.error(this.errorHandler.parseError(job));
          } else if (job.state !== JobState.Success) {
            return;
          }
          this.key = job.result;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.dialogRef.close();
          this.dialogService.error(this.errorHandler.parseError(error));
        },
      });
  }
}
