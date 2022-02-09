import {
  Component, ChangeDetectionStrategy, Inject, OnInit,
} from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { CoreBulkQuery, CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { Job } from 'app/interfaces/job.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { SnapshotDialogData } from 'app/pages/storage/snapshots/interfaces/snapshot-dialog-data.interface';
import { SnapshotListRow } from 'app/pages/storage/snapshots/interfaces/snapshot-list-row.interface';
import { DialogService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-snapshot-batch-delete-dialog',
  templateUrl: './snapshot-batch-delete-dialog.component.html',
  styleUrls: ['./snapshot-batch-delete-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnapshotBatchDeleteDialogComponent implements OnInit {
  constructor(
    private dialogService: DialogService,
    private translate: TranslateService,
    private matDialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) private snapshots: SnapshotListRow[],
  ) { }

  ngOnInit(): void {
    const batchDeleteMsg = this.getBatchDeleteMessage();
    this.dialogService.confirm({
      title: this.translate.instant('Delete'),
      message: batchDeleteMsg,
      buttonMsg: this.translate.instant('Delete'),
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => this.startBatchDeleteProgress());
  }

  wsBatchDeleteParams(): (string | string[][])[] {
    const snapshots = this.snapshots.map((item) => [item.dataset + '@' + item.snapshot]);
    return ['zfs.snapshot.delete', snapshots, '{0}'];
  }

  restructureData(): SnapshotDialogData {
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

  getBatchDeleteMessage(): string {
    let message = this.translate.instant(
      '<strong>The following { n, plural, one {snapshot} other {# snapshots} } will be deleted. Are you sure you want to proceed?</strong>',
      { n: this.snapshots.length },
    );

    message += '<br>';
    const info: SnapshotDialogData = this.restructureData();

    const datasetStart = "<div class='mat-list-item'>";
    const datasetEnd = '</div>';
    const listStart = '<ul>';
    const listEnd = '</ul>';
    const breakTag = '<br>';

    info.datasets.forEach((dataset) => {
      const totalSnapshots: number = info.snapshots[dataset].length;
      const snapshotText = this.translate.instant(
        '{ n, plural, one {# snapshot} other {# snapshots} }',
        { n: totalSnapshots },
      );
      const header = `<br/> <div><strong>${dataset}</strong> (${snapshotText}) </div>`;
      const listContent: string[] = [];

      info.snapshots[dataset].forEach((snapshot) => {
        listContent.push('<li>&nbsp;&nbsp;&nbsp;&nbsp;' + snapshot + '</li>');
      });

      const listContentString: string = listContent.toString();
      message += datasetStart + header + listStart + listContentString.replace(/\,/g, '') + listEnd + breakTag + datasetEnd;
    });

    return message;
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

        dialogRef.close();
        // this.entityList.getData();

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

    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe(() => {
      // new EntityUtils().handleWsError(this.entityList, err, this.dialogService);
      dialogRef.close();
    });
  }
}
