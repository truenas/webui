import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogClose, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { NewDeduplicationQuotaSetting } from 'app/enums/deduplication-setting.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { Pool, UpdatePool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

export enum QuotaType {
  Auto = 'AUTO',
  Custom = 'CUSTOM',
  None = 'NONE',
}

export const quotaTypeLabels = new Map<QuotaType, string>([
  [QuotaType.Auto, T('Auto')],
  [QuotaType.Custom, T('Custom')],
  [QuotaType.None, T('None')],
]);

@UntilDestroy()
@Component({
  selector: 'ix-set-dedup-quota',
  templateUrl: './set-dedup-quota.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormActionsComponent,
    MatButton,
    MatDialogTitle,
    ReactiveFormsModule,
    TestDirective,
    TranslateModule,
    MatDialogClose,
    IxSelectComponent,
    IxInputComponent,
  ],
})
export class SetDedupQuotaComponent {
  protected form = this.formBuilder.group({
    quotaType: [null as QuotaType],
    quotaValue: [null as number, Validators.min(0)],
  });

  protected quotaTypeOptions$ = of(mapToOptions(quotaTypeLabels, this.translate));

  constructor(
    private formBuilder: FormBuilder,
    private api: ApiService,
    private dialog: DialogService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private dialogRef: MatDialogRef<SetDedupQuotaComponent>,
    protected formatter: IxFormatterService,
    @Inject(MAT_DIALOG_DATA) protected pool: Pool,
  ) {
    let quotaType: QuotaType;
    switch (this.pool.dedup_table_quota) {
      case 'auto':
        quotaType = QuotaType.Auto;
        break;
      case '0':
        quotaType = QuotaType.None;
        break;
      default:
        quotaType = QuotaType.Custom;
    }

    this.form.patchValue({
      quotaType,
      quotaValue: parseInt(this.pool.dedup_table_quota, 10) || null,
    });
  }

  get hasCustomQuota(): boolean {
    return this.form.value.quotaType === QuotaType.Custom;
  }

  submit(): void {
    let payload: UpdatePool;
    switch (this.form.value.quotaType) {
      case QuotaType.Auto:
        payload = { dedup_table_quota: NewDeduplicationQuotaSetting.Auto };
        break;
      case QuotaType.Custom:
        payload = {
          dedup_table_quota: NewDeduplicationQuotaSetting.Custom,
          dedup_table_quota_value: this.form.value.quotaValue,
        };
        break;
      case QuotaType.None:
        payload = { dedup_table_quota: null };
        break;
    }

    const job$ = this.api.job('pool.update', [this.pool.id, payload]);

    this.dialog.jobDialog(job$, {
      title: this.translate.instant('Updating pool settings'),
    })
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Quota settings updated'));
        this.dialogRef.close(true);
      });
  }
}
