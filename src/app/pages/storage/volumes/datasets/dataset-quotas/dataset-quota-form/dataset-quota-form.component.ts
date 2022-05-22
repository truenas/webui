import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import globalHelptext from 'app/helptext/global-helptext';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-quotas';
import { DatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { QueryFilter, QueryParams } from 'app/interfaces/query-api.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './dataset-quota-form.component.html',
  styleUrls: ['./dataset-quota-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetQuotaFormComponent {
  isFormLoading = false;
  private datasetQuota: DatasetQuota;
  private pk: string;
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
      ? this.translate.instant(helptext.users.data_quota.placeholder)
        + this.translate.instant(globalHelptext.human_readable.suggestion_label)
      : this.translate.instant(helptext.groups.data_quota.placeholder)
        + this.translate.instant(globalHelptext.human_readable.suggestion_label);
  }
  get objectQuotaLabel(): string {
    return this.quotaType === DatasetQuotaType.User
      ? helptext.users.obj_quota.placeholder
      : helptext.groups.obj_quota.placeholder;
  }
  get dataQuotaTooltip(): string {
    return this.quotaType === DatasetQuotaType.User
      ? this.translate.instant(helptext.users.data_quota.tooltip)
        + this.translate.instant(globalHelptext.human_readable.suggestion_tooltip)
        + this.translate.instant(' bytes.')
      : this.translate.instant(helptext.groups.data_quota.tooltip)
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
  ) {}

  setupForm(quotaType: DatasetQuotaType, id: number, pk: string): void {
    this.pk = pk;
    this.quotaType = quotaType;

    const params = [['id', '=', id] as QueryFilter<DatasetQuota>] as QueryParams<DatasetQuota>;
    this.isFormLoading = true;
    this.ws.call('pool.dataset.get_quota', [pk, quotaType, params])
      .pipe(untilDestroyed(this)).subscribe(
        (res) => {
          this.datasetQuota = res[0];
          this.isFormLoading = false;
          this.form.patchValue({
            name: this.datasetQuota.name,
            data_quota: this.datasetQuota.quota,
            obj_quota: this.datasetQuota.obj_quota,
          });
          this.cdr.markForCheck();
        }, (error) => {
          this.isFormLoading = false;
          this.errorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      );
  }

  onSubmit(): void {
    this.isFormLoading = true;

    const values = this.form.value;
    const payload = [];
    payload.push({
      quota_type: this.quotaType,
      id: String(this.datasetQuota.id),
      quota_value: values.data_quota,
    },
    {
      quota_type: this.quotaType === DatasetQuotaType.User
        ? DatasetQuotaType.UserObj
        : DatasetQuotaType.GroupObj,
      id: String(this.datasetQuota.id),
      quota_value: values.obj_quota,
    });

    this.ws.call('pool.dataset.set_quota', [this.pk, payload])
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.isFormLoading = false;
        this.slideIn.close();
        this.cdr.markForCheck();
      }, (error) => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.errorHandler.handleWsFormError(error, this.form);
      });
  }
}
