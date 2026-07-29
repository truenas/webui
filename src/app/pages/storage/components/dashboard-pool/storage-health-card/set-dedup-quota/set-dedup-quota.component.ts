import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnDialogShellComponent, TnFormFieldComponent, TnInputComponent, TnSelectComponent,
  InputType,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { NewDeduplicationQuotaSetting } from 'app/enums/deduplication-setting.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { Pool, UpdatePool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

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

@Component({
  selector: 'ix-set-dedup-quota',
  templateUrl: './set-dedup-quota.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    AsyncPipe,
    FormActionsComponent,
    TnButtonComponent,
    ReactiveFormsModule,
    TranslateModule,
    TnFormFieldComponent,
    TnInputComponent,
    TnSelectComponent,
  ],
})
export class SetDedupQuotaComponent {
  protected readonly InputType = InputType;
  private formBuilder = inject(NonNullableFormBuilder);
  private api = inject(ApiService);
  private dialog = inject(DialogService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  protected dialogRef = inject<DialogRef<unknown, SetDedupQuotaComponent>>(DialogRef);
  protected pool = inject<Pool>(DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  protected form = this.formBuilder.group({
    quotaType: [null as QuotaType | null],
    quotaValue: [null as number | null, Validators.min(0)],
  });

  protected quotaTypeOptions$ = of(mapToOptions(quotaTypeLabels, this.translate));

  constructor() {
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
      quotaValue: parseInt(this.pool.dedup_table_quota || '', 10) || null,
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
          dedup_table_quota_value: this.form.value.quotaValue || undefined,
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
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Quota settings updated'));
        this.dialogRef.close(true);
      });
  }
}
