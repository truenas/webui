import {
  Component, ChangeDetectionStrategy, Inject, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { CoreBulkQuery, CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { Job } from 'app/interfaces/job.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { SnapshotDialogData } from 'app/pages/storage/snapshots/interfaces/snapshot-dialog-data.interface';
import { SnapshotListRow } from 'app/pages/storage/snapshots/interfaces/snapshot-list-row.interface';
import { DialogService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './snapshot-batch-delete-dialog.component.html',
  styleUrls: ['./snapshot-batch-delete-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnapshotBatchDeleteDialogComponent implements OnInit {
  form = this.fb.group({
    confirm: [false, [Validators.requiredTrue]],
  });
  total = this.snapshots.length;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SnapshotBatchDeleteDialogComponent>,
    private dialogService: DialogService,
    private translate: TranslateService,
    private matDialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) private snapshots: SnapshotListRow[],
  ) { }

  ngOnInit(): void {
    this.prepareDialogData();
  }

  prepareDialogData(): SnapshotDialogData {
    const datasets: string[] = [];
    const snapshots: { [index: string]: string[] } = {};
    this.snapshots.forEach((item) => {
      if (!snapshots[item.dataset]) {
        datasets.push(item.dataset);
        snapshots[item.dataset] = [];
      }

      snapshots[item.dataset].push(item.snapshot);
    });

    return { datasets, snapshots };
  }

  onSubmit(): void {
    this.startBatchDeleteProgress();
  }

  wsBatchDeleteParams(): (string | string[][])[] {
    const snapshots = this.snapshots.map((item) => [item.dataset + '@' + item.snapshot]);
    return ['zfs.snapshot.delete', snapshots, '{0}'];
  }

  startBatchDeleteProgress(): void {
    const params = this.wsBatchDeleteParams();
    const dialogRef = this.matDialog.open(EntityJobComponent, {
      data: {
        title: this.translate.instant('Deleting Snapshots'),
      },
      disableClose: true,
    });
    dialogRef.componentInstance.setCall('core.bulk', params as CoreBulkQuery);
    dialogRef.componentInstance.submit();

    dialogRef.componentInstance.success
      .pipe(untilDestroyed(this))
      .subscribe((job: Job<CoreBulkResponse<boolean>[]>) => {
        const jobErrors: string[] = [];
        const jobSuccess: boolean[] = [];

        job.result.forEach((item) => {
          if (item.error) {
            jobErrors.push(item.error);
          } else {
            jobSuccess.push(item.result);
          }
        });

        this.dialogRef.close();
        dialogRef.close();

        if (jobErrors.length > 0) {
          const errorTitle = this.translate.instant('Warning: {n} of {total} snapshots could not be deleted.', { n: jobErrors.length, total: params[1].length });

          let errorMessage = jobErrors.map((err) => err + '\n').toString();
          errorMessage = errorMessage.split(',').join('');
          errorMessage = errorMessage.split('[').join('\n *** [');
          errorMessage = errorMessage.split(']').join(']\n');

          this.dialogService.errorReport(errorTitle, '', errorMessage);
        } else {
          this.dialogService.info(
            this.translate.instant('Deleted {n, plural, one {# snapshot} other {# snapshots}}', { n: jobSuccess.length }),
            '',
            '320px',
            'info',
            true,
          );
        }
      });

    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
      new EntityUtils().handleWsError(this, error, this.dialogService);
      dialogRef.close();
    });
  }
}
