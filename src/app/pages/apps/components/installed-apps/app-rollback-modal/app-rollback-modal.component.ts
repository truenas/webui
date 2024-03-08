import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { ChartRollbackParams } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

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

  readonly helptext = helptextApps.charts.rollback_dialog.version.tooltip;
  protected readonly requiredRoles = [Role.AppsWrite];

  constructor(
    private dialogRef: MatDialogRef<AppRollbackModalComponent>,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private formBuilder: FormBuilder,
    private errorHandler: ErrorHandlerService,
    @Inject(MAT_DIALOG_DATA) private chartRelease: ChartRelease,
  ) {
    this.setVersionOptions();
  }

  onRollback(): void {
    const rollbackParams = this.form.value as Required<ChartRollbackParams>;

    this.dialogService.jobDialog(
      this.ws.job('chart.release.rollback', [this.chartRelease.name, rollbackParams]),
      { title: helptextApps.charts.rollback_dialog.job },
    )
      .afterClosed()
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe(() => this.dialogRef.close(true));
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
