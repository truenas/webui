import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of } from 'rxjs';
import helptext from 'app/helptext/apps/apps';
import { ChartRollbackParams } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { Option } from 'app/interfaces/option.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';

@UntilDestroy()
@Component({
  templateUrl: './app-rollback-modal.component.html',
  styleUrls: ['./app-rollback-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppRollbackModalComponent {
  form = this.formBuilder.group({
    item_version: ['', Validators.required],
    rollback_snapshot: [false],
  });

  versionOptions$: Observable<Option[]>;

  readonly helptext = helptext.charts.rollback_dialog.version.tooltip;

  constructor(
    private dialogRef: MatDialogRef<AppRollbackModalComponent>,
    private matDialog: MatDialog,
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) private chartRelease: ChartRelease,
  ) {
    this.setVersionOptions();
  }

  onRollback(): void {
    const rollbackParams = this.form.value as Required<ChartRollbackParams>;

    const jobDialogRef = this.matDialog.open(EntityJobComponent, {
      data: {
        title: helptext.charts.rollback_dialog.job,
      },
    });
    jobDialogRef.componentInstance.setCall('chart.release.rollback', [this.chartRelease.name, rollbackParams]);
    jobDialogRef.componentInstance.submit();

    jobDialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      jobDialogRef.close(true);
      this.dialogRef.close(true);
    });

    jobDialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogRef.close(true);
    });
  }

  private setVersionOptions(): void {
    const options = Object.keys(this.chartRelease.history).map((version) => ({
      label: version,
      value: version,
    }));

    this.versionOptions$ = of(options);
    if (options.length) {
      this.selectFirstVersion();
    }
  }

  private selectFirstVersion(): void {
    this.form.patchValue({
      item_version: Object.keys(this.chartRelease.history)[0],
    });
  }
}
