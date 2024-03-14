import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { switchMap } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './export-dataset-key-dialog.component.html',
  styleUrls: ['./export-dataset-key-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportDatasetKeyDialogComponent implements OnInit {
  key: string;

  constructor(
    private ws: WebSocketService,
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

    this.ws.call('core.download', ['pool.dataset.export_key', [this.dataset.id, true], fileName])
      .pipe(
        this.loader.withLoader(),
        switchMap(([, url]) => this.storageService.downloadUrl(url, fileName, mimetype)),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => {
          this.dialogRef.close();
        },
        error: (error: WebSocketError | HttpErrorResponse) => {
          this.dialogService.error(this.errorHandler.parseError(error));
        },
      });
  }

  private loadKey(): void {
    this.ws.job('pool.dataset.export_key', [this.dataset.id])
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
        error: (error: Job | WebSocketError) => {
          this.dialogService.error(this.errorHandler.parseError(error));
        },
      });
  }
}
