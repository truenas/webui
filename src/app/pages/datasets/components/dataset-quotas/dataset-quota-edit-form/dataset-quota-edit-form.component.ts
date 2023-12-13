import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  EMPTY, Observable, of, switchMap,
} from 'rxjs';
import { catchError, filter, tap } from 'rxjs/operators';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { helptextGlobal } from 'app/helptext/global-helptext';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-quotas';
import { DatasetQuota, SetDatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { Job } from 'app/interfaces/job.interface';
import { QueryFilter, QueryParams } from 'app/interfaces/query-api.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './dataset-quota-edit-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetQuotaEditFormComponent implements OnInit {
  isFormLoading = false;
  private datasetQuota: DatasetQuota;
  private datasetId: string;
  private quotaType: DatasetQuotaType;
  private id: number;

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
      + this.translate.instant(helptextGlobal.human_readable.suggestion_label);
  }

  private getGroupDataQuotaLabel(): string {
    return this.translate.instant(helptext.groups.data_quota.placeholder)
      + this.translate.instant(helptextGlobal.human_readable.suggestion_label);
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
      + this.translate.instant(helptextGlobal.human_readable.suggestion_tooltip)
      + this.translate.instant(' bytes.');
  }

  private getGroupDataQuotaTooltip(): string {
    return this.translate.instant(helptext.groups.data_quota.tooltip)
      + this.translate.instant(helptextGlobal.human_readable.suggestion_tooltip)
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
    private snackbar: SnackbarService,
    protected dialogService: DialogService,
    private slideInRef: IxSlideInRef<DatasetQuotaEditFormComponent>,
    @Inject(SLIDE_IN_DATA) private slideInData: { quotaType: DatasetQuotaType; datasetId: string; id: number },
  ) {}

  ngOnInit(): void {
    this.datasetId = this.slideInData.datasetId;
    this.quotaType = this.slideInData.quotaType;
    this.id = this.slideInData.id;
    this.setupEditQuotaForm();
  }

  setupEditQuotaForm(): void {
    this.updateForm();
  }

  private updateForm(): void {
    this.isFormLoading = true;
    this.getQuota(this.id).pipe(
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

    canSubmit$.pipe(
      filter(Boolean),
      switchMap(() => {
        this.isFormLoading = true;
        return this.ws.call('pool.dataset.set_quota', [this.datasetId, payload]);
      }),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.snackbar.success(this.translate.instant('Quotas updated'));
        this.isFormLoading = false;
        this.slideInRef.close(true);
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.errorHandler.handleWsFormError(error, this.form);
      },
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
