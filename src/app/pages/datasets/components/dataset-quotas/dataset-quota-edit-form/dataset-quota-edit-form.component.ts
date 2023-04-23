import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, filter, tap } from 'rxjs/operators';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import globalHelptext from 'app/helptext/global-helptext';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-quotas';
import { DatasetQuota, SetDatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { Job } from 'app/interfaces/job.interface';
import { QueryFilter, QueryParams } from 'app/interfaces/query-api.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './dataset-quota-edit-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetQuotaEditFormComponent {
  isFormLoading = false;
  private datasetQuota: DatasetQuota;
  private datasetId: string;
  private quotaType: DatasetQuotaType;

  get title(): string {
    return this.quotaType === DatasetQuotaType.User
      ? this.translate.instant('Edit User Quota')
      : this.translate.instant('Edit Group Quota');
  }
  get nameLabel(): string {
    return this.quotaType === DatasetQuotaType.User
      ? helptext.users.dialog.user.placeholder
      : helptext.groups.dialog.group.placeholder;
  }
  get dataQuotaLabel(): string {
    return this.quotaType === DatasetQuotaType.User
      ? this.getUserDataQuotaLabel()
      : this.getGroupDataQuotaLabel();
  }

  private getUserDataQuotaLabel(): string {
    return this.translate.instant(helptext.users.data_quota.placeholder)
      + this.translate.instant(globalHelptext.human_readable.suggestion_label);
  }

  private getGroupDataQuotaLabel(): string {
    return this.translate.instant(helptext.groups.data_quota.placeholder)
      + this.translate.instant(globalHelptext.human_readable.suggestion_label);
  }

  get objectQuotaLabel(): string {
    return this.quotaType === DatasetQuotaType.User
      ? helptext.users.obj_quota.placeholder
      : helptext.groups.obj_quota.placeholder;
  }
  get dataQuotaTooltip(): string {
    return this.quotaType === DatasetQuotaType.User
      ? this.getUserDataQuotaTooltip()
      : this.getGroupDataQuotaTooltip();
  }

  private getUserDataQuotaTooltip(): string {
    return this.translate.instant(helptext.users.data_quota.tooltip)
      + this.translate.instant(globalHelptext.human_readable.suggestion_tooltip)
      + this.translate.instant(' bytes.');
  }

  private getGroupDataQuotaTooltip(): string {
    return this.translate.instant(helptext.groups.data_quota.tooltip)
      + this.translate.instant(globalHelptext.human_readable.suggestion_tooltip)
      + this.translate.instant(' bytes.');
  }

  get objectQuotaTooltip(): string {
    return this.quotaType === DatasetQuotaType.User
      ? helptext.users.obj_quota.tooltip
      : helptext.groups.obj_quota.tooltip;
  }

  form = this.formBuilder.group({
    name: [''],
    data_quota: [null as number],
    obj_quota: [null as number],
  });

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private translate: TranslateService,
    public formatter: IxFormatterService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private slideIn: IxSlideInService,
    protected dialogService: DialogService,
  ) {}

  setupEditQuotaForm(quotaType: DatasetQuotaType, datasetId: string, id: number): void {
    this.datasetId = datasetId;
    this.quotaType = quotaType;
    this.updateForm(id);
  }

  private updateForm(id: number): void {
    this.isFormLoading = true;
    this.getQuota(id).pipe(
      tap((quotas) => {
        this.datasetQuota = quotas[0];
        this.isFormLoading = false;
        this.form.patchValue({
          name: this.datasetQuota.name || '',
          data_quota: this.datasetQuota.quota || null,
          obj_quota: this.datasetQuota.obj_quota,
        });
        this.cdr.markForCheck();
      }),
      catchError((error: WebsocketError | Job) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  getQuota(id: number): Observable<DatasetQuota[]> {
    const params = [['id', '=', id] as QueryFilter<DatasetQuota>] as QueryParams<DatasetQuota>;
    return this.ws.call('pool.dataset.get_quota', [this.datasetId, this.quotaType, params]);
  }

  onSubmit(): void {
    const values = this.form.value;
    const payload: SetDatasetQuota[] = [];
    payload.push({
      quota_type: this.quotaType,
      id: String(this.datasetQuota.id),
      quota_value: values.data_quota || 0,
    });
    payload.push({
      quota_type: this.quotaType === DatasetQuotaType.User
        ? DatasetQuotaType.UserObj
        : DatasetQuotaType.GroupObj,
      id: String(this.datasetQuota.id),
      quota_value: values.obj_quota || 0,
    });

    this.submit(values, payload);
  }

  private submit(values: typeof this.form.value, payload: SetDatasetQuota[]): void {
    let canSubmit$ = of(true);
    if (this.isUnsettingQuota(values)) {
      canSubmit$ = this.getConfirmation(values.name);
    }

    canSubmit$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.isFormLoading = true;
      this.ws.call('pool.dataset.set_quota', [this.datasetId, payload])
        .pipe(untilDestroyed(this))
        .subscribe({
          next: () => {
            this.isFormLoading = false;
            this.slideIn.closeAll();
            this.cdr.markForCheck();
          },
          error: (error) => {
            this.isFormLoading = false;
            this.cdr.markForCheck();
            this.errorHandler.handleWsFormError(error, this.form);
          },
        });
    });
  }

  private isUnsettingQuota(values: typeof this.form.value): boolean {
    return !values.data_quota && !values.obj_quota;
  }

  private getConfirmation(name: string): Observable<boolean> {
    return this.dialogService.confirm({
      title: this.quotaType === DatasetQuotaType.User
        ? this.translate.instant('Delete User Quota')
        : this.translate.instant('Delete Group Quota'),
      message: this.quotaType === DatasetQuotaType.User
        ? this.translate.instant('Are you sure you want to delete the user quota <b>{name}</b>?', { name })
        : this.translate.instant('Are you sure you want to delete the group quota <b>{name}</b>?', { name }),
      buttonText: this.translate.instant('Delete'),
    });
  }
}
