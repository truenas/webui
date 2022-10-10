import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { switchMap } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import {
  AppLoaderService, DialogService, StorageService, WebSocketService,
} from 'app/services';

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
    private dialogRef: MatDialogRef<ExportDatasetKeyDialogComponent>,
    private dialogService: DialogService,
    private storageService: StorageService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public dataset: Dataset,
  ) { }

  ngOnInit(): void {
    this.loadKey();
  }

  onDownload(): void {
    const fileName = `dataset_${this.dataset.name}_key.json`;
    const mimetype = 'application/json';

    this.loader.open();
    this.ws.call('core.download', ['pool.dataset.export_key', [this.dataset.id, true], fileName])
      .pipe(
        switchMap(([, url]) => this.storageService.downloadUrl(url, fileName, mimetype)),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => {
          this.loader.close();
          this.dialogRef.close();
        },
        error: (error) => {
          this.loader.close();
          this.dialogService.errorReportMiddleware(error);
        },
      });
  }

  private loadKey(): void {
    this.loader.open();
    this.ws.job('pool.dataset.export_key', [this.dataset.id])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (job) => {
          if (job.state !== JobState.Success) {
            return;
          }
          this.key = job.result;
          this.cdr.markForCheck();
          this.loader.close();
        },
        error: (error) => {
          this.loader.close();
          this.dialogService.errorReportMiddleware(error);
        },
      });
  }
}
