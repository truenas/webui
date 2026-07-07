import {
  ChangeDetectionStrategy, Component, inject, input,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  InputType, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { Observable } from 'rxjs';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { Role } from 'app/enums/role.enum';
import { helptextGlobal } from 'app/helptext/global-helptext';
import { helptextQuotas } from 'app/helptext/storage/volumes/datasets/dataset-quotas';
import { SetDatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxGroupChipsComponent } from 'app/modules/forms/ix-forms/components/ix-group-chips/ix-group-chips.component';
import { IxUserChipsComponent } from 'app/modules/forms/ix-forms/components/ix-user-chips/ix-user-chips.component';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-dataset-quota-add-form',
  templateUrl: './dataset-quota-add-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TranslateModule,
    IxGroupChipsComponent,
    IxUserChipsComponent,
  ],
})
export class DatasetQuotaAddFormComponent extends IxFormHostForm {
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);

  /** Context supplied by the `<tn-side-panel>` host (via {@link FormSidePanelService}). */
  readonly datasetId = input.required<string>();
  readonly quotaType = input.required<DatasetQuotaType>();

  protected readonly requiredRoles = [Role.DatasetWrite];
  protected readonly InputType = InputType;
  protected readonly DatasetQuotaType = DatasetQuotaType;

  protected get dataQuotaLabel(): string {
    if (this.quotaType() === DatasetQuotaType.User) {
      return this.translate.instant(helptextQuotas.users.dataQuota.label)
        + this.translate.instant(helptextGlobal.humanReadable.suggestionLabel);
    }

    return this.translate.instant(helptextQuotas.groups.dataQuota.label)
      + this.translate.instant(helptextGlobal.humanReadable.suggestionLabel);
  }

  protected get objectQuotaLabel(): string {
    return this.quotaType() === DatasetQuotaType.User
      ? helptextQuotas.users.objQuota.label
      : helptextQuotas.groups.objectQuota.label;
  }

  protected get dataQuotaTooltip(): string {
    return this.quotaType() === DatasetQuotaType.User
      ? this.translate.instant(helptextQuotas.users.dataQuota.tooltip)
      + ' ' + this.translate.instant(helptextQuotas.fieldAcceptsTooltip)
      : this.translate.instant(helptextQuotas.groups.dataQuota.tooltip)
        + ' ' + this.translate.instant(helptextQuotas.fieldAcceptsTooltip);
  }

  protected get objectQuotaTooltip(): string {
    return this.quotaType() === DatasetQuotaType.User
      ? helptextQuotas.users.objQuota.tooltip
      : helptextQuotas.groups.objectQuota.tooltip;
  }

  protected form = this.formBuilder.nonNullable.group({
    data_quota: [null as number | null],
    obj_quota: [null as number | null],
    users: [[] as string[]],
    groups: [[] as string[]],
  });

  readonly tooltips = {
    users: helptextQuotas.users.tooltip,
    groups: helptextQuotas.groups.tooltip,
  };

  protected handleSubmit = (_: FormSubmitEvent): SubmitResult => {
    const quotas = this.getQuotas();
    const request$: Observable<void> = this.api.call('pool.dataset.set_quota', [this.datasetId(), quotas]);

    return {
      request$,
      successMessage: this.translate.instant('Quotas added'),
    };
  };

  private getQuotas(): SetDatasetQuota[] {
    const quotas: SetDatasetQuota[] = [];
    const formValues = this.form.getRawValue();

    switch (this.quotaType()) {
      case DatasetQuotaType.User:
        formValues.users.forEach((user) => {
          if (Number(formValues.data_quota) > 0) {
            quotas.push({
              id: String(user),
              quota_type: DatasetQuotaType.User,
              quota_value: Number(formValues.data_quota),
            });
          }
          if (Number(formValues.obj_quota) > 0) {
            quotas.push({
              id: String(user),
              quota_type: DatasetQuotaType.UserObj,
              quota_value: Number(formValues.obj_quota),
            });
          }
        });
        break;
      case DatasetQuotaType.Group:
        formValues.groups.forEach((group) => {
          if (Number(formValues.data_quota) > 0) {
            quotas.push({
              id: String(group),
              quota_type: DatasetQuotaType.Group,
              quota_value: Number(formValues.data_quota),
            });
          }
          if (Number(formValues.obj_quota) > 0) {
            quotas.push({
              id: String(group),
              quota_type: DatasetQuotaType.GroupObj,
              quota_value: Number(formValues.obj_quota),
            });
          }
        });
        break;
      default:
        throw new Error(`Unexpected quota type: ${this.quotaType()}`);
    }

    return quotas;
  }
}
