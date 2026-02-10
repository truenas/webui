import {
  ChangeDetectionStrategy, Component, DestroyRef, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { Role } from 'app/enums/role.enum';
import { helptextGlobal } from 'app/helptext/global-helptext';
import { helptextQuotas } from 'app/helptext/storage/volumes/datasets/dataset-quotas';
import { SetDatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxGroupChipsComponent } from 'app/modules/forms/ix-forms/components/ix-group-chips/ix-group-chips.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxUserChipsComponent } from 'app/modules/forms/ix-forms/components/ix-user-chips/ix-user-chips.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-dataset-quota-add-form',
  templateUrl: './dataset-quota-add-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    RequiresRolesDirective,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    TranslateModule,
    IxGroupChipsComponent,
    IxUserChipsComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
  ],
})
export class DatasetQuotaAddFormComponent {
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  formatter = inject(IxFormatterService);
  private errorHandler = inject(FormErrorHandlerService);
  slideInRef = inject<SlideInRef<{
    quotaType: DatasetQuotaType;
    datasetId: string;
  }, boolean>>(SlideInRef);

  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.DatasetWrite];

  protected isLoading = signal(false);
  quotaType: DatasetQuotaType;
  readonly DatasetQuotaType = DatasetQuotaType;

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

  readonly tooltips = {
    users: helptextQuotas.users.tooltip,
    groups: helptextQuotas.groups.tooltip,
  };

  private datasetId: string;

  constructor() {
    const slideInRef = this.slideInRef;

    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });

    this.quotaType = slideInRef.getData().quotaType;
    this.datasetId = slideInRef.getData().datasetId;
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
          this.slideInRef.close({ response: true });
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
