import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { assertUnreachable } from 'app/helpers/assert-unreachable.utils';
import globalHelptext from 'app/helptext/global-helptext';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-quotas';
import { SetDatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { ChipsProvider } from 'app/modules/ix-forms/components/ix-chips/chips-provider';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { UserService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './dataset-quota-add-form.component.html',
  styleUrls: ['./dataset-quota-add-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetQuotaAddFormComponent {
  isLoading = false;
  quotaType: DatasetQuotaType;
  readonly DatasetQuotaType = DatasetQuotaType;

  get title(): string {
    return this.quotaType === DatasetQuotaType.User
      ? this.translate.instant('Add User Quotas')
      : this.translate.instant('Add Group Quotas');
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
        + ' ' + this.translate.instant(helptext.field_accepts_tooltip)
      : this.translate.instant(helptext.groups.data_quota.tooltip)
        + ' ' + this.translate.instant(helptext.field_accepts_tooltip);
  }
  get objectQuotaTooltip(): string {
    return this.quotaType === DatasetQuotaType.User
      ? helptext.users.obj_quota.tooltip
      : helptext.groups.obj_quota.tooltip;
  }

  form = this.formBuilder.group({
    data_quota: [null as number],
    obj_quota: [null as number],
    users: [[] as string[]],
    groups: [[] as string[]],
  });

  readonly tooltips = {
    users: helptext.users.usersTooltip,
    groups: helptext.groups.groupsTooltip,
  };

  usersProvider: ChipsProvider = (query) => {
    return this.userService.userQueryDsCache(query).pipe(
      map((users) => users.map((user) => user.username)),
    );
  };

  groupProvider: ChipsProvider = (query) => {
    return this.userService.groupQueryDsCache(query).pipe(
      map((groups) => groups.map((group) => group.group)),
    );
  };

  private datasetId: string;

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private translate: TranslateService,
    public formatter: IxFormatterService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private userService: UserService,
    private slideIn: IxSlideInService,
  ) {}

  setupAddQuotaForm(quotaType: DatasetQuotaType, datasetId: string): void {
    this.datasetId = datasetId;
    this.quotaType = quotaType;
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    this.isLoading = true;

    const quotas = this.getQuotas();
    this.ws.call('pool.dataset.set_quota', [this.datasetId, quotas])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.slideIn.close();
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.errorHandler.handleWsFormError(error, this.form);
        },
      });
  }

  private getQuotas(): SetDatasetQuota[] {
    const quotas: SetDatasetQuota[] = [];
    const formValues = this.form.value;

    switch (this.quotaType) {
      case DatasetQuotaType.User:
        formValues.users.forEach((user) => {
          if (formValues.data_quota > 0) {
            quotas.push({
              id: String(user),
              quota_type: DatasetQuotaType.User,
              quota_value: formValues.data_quota,
            });
          }
          if (formValues.obj_quota > 0) {
            quotas.push({
              id: String(user),
              quota_type: DatasetQuotaType.UserObj,
              quota_value: formValues.obj_quota,
            });
          }
        });
        break;
      case DatasetQuotaType.Group:
        formValues.groups.forEach((group) => {
          if (formValues.data_quota > 0) {
            quotas.push({
              id: String(group),
              quota_type: DatasetQuotaType.Group,
              quota_value: formValues.data_quota,
            });
          }
          if (formValues.obj_quota > 0) {
            quotas.push({
              id: String(group),
              quota_type: DatasetQuotaType.GroupObj,
              quota_value: formValues.obj_quota,
            });
          }
        });
        break;
      default:
        assertUnreachable(this.quotaType as never);
    }

    return quotas;
  }
}
