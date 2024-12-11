import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { switchMap } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

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
    private loader: AppLoaderService,
    private errorHandler: ErrorHandlerService,
    private dialogRef: MatDialogRef<ExportDatasetKeyDialogComponent>,
    private dialogService: DialogService,
    private storageService: DownloadService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public dataset: Dataset,
  ) { }

  ngOnInit(): void {
    this.loadKey();
  }

  onDownload(): void {
    const fileName = `dataset_${this.dataset.name}_key.json`;
    const mimetype = 'application/json';

    this.api.call('core.download', ['pool.dataset.export_key', [this.dataset.id, true], fileName])
      .pipe(
        this.loader.withLoader(),
        switchMap(([, url]) => this.storageService.downloadUrl(url, fileName, mimetype)),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => {
          this.dialogRef.close();
        },
        error: (error: unknown) => {
          this.dialogService.error(this.errorHandler.parseError(error));
        },
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
          this.dialogService.error(this.errorHandler.parseError(error));
        },
      });
  }
}
