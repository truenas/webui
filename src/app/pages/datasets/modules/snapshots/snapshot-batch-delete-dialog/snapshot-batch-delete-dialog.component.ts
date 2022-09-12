import {
  Component, ChangeDetectionStrategy, Inject, OnInit, ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { filter, map } from 'rxjs/operators';
import { CoreBulkQuery, CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { Job } from 'app/interfaces/job.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { SnapshotDialogData } from 'app/pages/datasets/modules/snapshots/interfaces/snapshot-dialog-data.interface';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './snapshot-batch-delete-dialog.component.html',
  styleUrls: ['./snapshot-batch-delete-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnapshotBatchDeleteDialogComponent implements OnInit {
  isJobCompleted = false;
  form = this.fb.group({
    confirm: [false, [Validators.requiredTrue]],
  });
  total = this.snapshots.length;
  dialogData: SnapshotDialogData;
  jobSuccess: boolean[] = [];
  jobErrors: string[] = [];

  constructor(
    private fb: FormBuilder,
    private websocket: WebSocketService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) private snapshots: ZfsSnapshot[],
    private dialogService: DialogService,
  ) { }

  ngOnInit(): void {
    this.dialogData = this.prepareDialogData();
  }

  prepareDialogData(): SnapshotDialogData {
    const datasets: string[] = [];
    const snapshots: { [index: string]: string[] } = {};
    this.snapshots.forEach((item) => {
      if (!snapshots[item.dataset]) {
        datasets.push(item.dataset);
        snapshots[item.dataset] = [];
      }

      snapshots[item.dataset].push(item.snapshot_name);
    });

    return { datasets, snapshots };
  }

  onSubmit(): void {
    const snapshots = this.snapshots.map((item) => [item.name]);
    const params: CoreBulkQuery = ['zfs.snapshot.delete', snapshots];
    this.websocket.job('core.bulk', params).pipe(
      filter((job: Job<CoreBulkResponse<boolean>[]>) => !!job.result),
      map((job: Job<CoreBulkResponse<boolean>[]>) => job.result),
      untilDestroyed(this),
    ).subscribe({
      next: (results: CoreBulkResponse<boolean>[]) => {
        results.forEach((item) => {
          if (item.error) {
            this.jobErrors.push(item.error);
          } else {
            this.jobSuccess.push(item.result);
          }
        });
        this.isJobCompleted = true;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.dialogService.errorReportMiddleware(error);
      },
    });
  }

  getErrorMessage(): string {
    return this.jobErrors.map((error) => error + '\n')
      .toString()
      .split(',')
      .join('')
      .split('[')
      .join('\n *** [')
      .split(']')
      .join(']\n');
  }
}
