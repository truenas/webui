import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject, input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  InputType, TnButtonComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { Role } from 'app/enums/role.enum';
import { helptextGlobal } from 'app/helptext/global-helptext';
import { helptextQuotas } from 'app/helptext/storage/volumes/datasets/dataset-quotas';
import { SetDatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxGroupChipsComponent } from 'app/modules/forms/ix-forms/components/ix-group-chips/ix-group-chips.component';
import { IxUserChipsComponent } from 'app/modules/forms/ix-forms/components/ix-user-chips/ix-user-chips.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-dataset-quota-add-form',
  templateUrl: './dataset-quota-add-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    RequiresRolesDirective,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TranslateModule,
    IxGroupChipsComponent,
    IxUserChipsComponent,
    FormActionsComponent,
    TnButtonComponent,
  ],
})
export class DatasetQuotaAddFormComponent extends SidePanelForm implements OnInit {
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private errorHandler = inject(FormErrorHandlerService);

  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.DatasetWrite];

  protected isLoading = signal(false);
  quotaType: DatasetQuotaType;
  readonly DatasetQuotaType = DatasetQuotaType;
  protected readonly InputType = InputType;

  /**
   * Quota type / dataset to preset when hosted in a `<tn-side-panel>` (which has no
   * `SlideInRef` to carry data). Unused in the legacy SlideIn host.
   */
  readonly presetQuotaType = input<DatasetQuotaType | undefined>(undefined);
  readonly presetDatasetId = input<string | undefined>(undefined);

  get title(): string {
    return this.quotaType === DatasetQuotaType.User
      ? this.translate.instant('Add User Quotas')
      : this.translate.instant('Add Group Quotas');
  }

  get dataQuotaLabel(): string {
    if (this.quotaType === DatasetQuotaType.User) {
      return this.translate.instant(helptextQuotas.users.dataQuota.label)
        + this.translate.instant(helptextGlobal.humanReadable.suggestionLabel);
    }

    return this.translate.instant(helptextQuotas.groups.dataQuota.label)
      + this.translate.instant(helptextGlobal.humanReadable.suggestionLabel);
  }

  get objectQuotaLabel(): string {
    return this.quotaType === DatasetQuotaType.User
      ? helptextQuotas.users.objQuota.label
      : helptextQuotas.groups.objectQuota.label;
  }

  get dataQuotaTooltip(): string {
    return this.quotaType === DatasetQuotaType.User
      ? this.translate.instant(helptextQuotas.users.dataQuota.tooltip)
      + ' ' + this.translate.instant(helptextQuotas.fieldAcceptsTooltip)
      : this.translate.instant(helptextQuotas.groups.dataQuota.tooltip)
        + ' ' + this.translate.instant(helptextQuotas.fieldAcceptsTooltip);
  }

  get objectQuotaTooltip(): string {
    return this.quotaType === DatasetQuotaType.User
      ? helptextQuotas.users.objQuota.tooltip
      : helptextQuotas.groups.objectQuota.tooltip;
  }

  form = this.formBuilder.nonNullable.group({
    data_quota: [null as number | null],
    obj_quota: [null as number | null],
    users: [[] as string[]],
    groups: [[] as string[]],
  });

  readonly canSubmit = this.trackCanSubmit(this.isLoading);

  readonly tooltips = {
    users: helptextQuotas.users.tooltip,
    groups: helptextQuotas.groups.tooltip,
  };

  private datasetId: string;

  ngOnInit(): void {
    const data = this.slideInRef
      ? this.slideInRef.getData() as { quotaType: DatasetQuotaType; datasetId: string }
      : { quotaType: this.presetQuotaType(), datasetId: this.presetDatasetId() };

    this.quotaType = data.quotaType;
    this.datasetId = data.datasetId;
  }

  protected onSubmit(): void {
    this.isLoading.set(true);

    const quotas = this.getQuotas();
    this.api.call('pool.dataset.set_quota', [this.datasetId, quotas])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackbar.success(this.translate.instant('Quotas added'));
          this.isLoading.set(false);
          this.close(true);
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.errorHandler.handleValidationErrors(error, this.form);
        },
      });
  }

  private getQuotas(): SetDatasetQuota[] {
    const quotas: SetDatasetQuota[] = [];
    const formValues = this.form.getRawValue();

    switch (this.quotaType) {
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
        throw new Error(`Unexpected quota type: ${this.quotaType}`);
    }

    return quotas;
  }
}
