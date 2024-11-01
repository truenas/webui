import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { Role } from 'app/enums/role.enum';
import { helptextGlobal } from 'app/helptext/global-helptext';
import { helpTextQuotas } from 'app/helptext/storage/volumes/datasets/dataset-quotas';
import { SetDatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { ChipsProvider } from 'app/modules/forms/ix-forms/components/ix-chips/chips-provider';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { UserService } from 'app/services/user.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-quota-add-form',
  templateUrl: './dataset-quota-add-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    RequiresRolesDirective,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    TranslateModule,
    IxChipsComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
  ],
})
export class DatasetQuotaAddFormComponent implements OnInit {
  readonly requiredRoles = [Role.DatasetWrite];

  isLoading = false;
  quotaType: DatasetQuotaType;
  readonly DatasetQuotaType = DatasetQuotaType;

  get title(): string {
    return this.quotaType === DatasetQuotaType.User
      ? this.translate.instant('Add User Quotas')
      : this.translate.instant('Add Group Quotas');
  }

  get dataQuotaLabel(): string {
    if (this.quotaType === DatasetQuotaType.User) {
      return this.translate.instant(helpTextQuotas.users.data_quota.placeholder)
        + this.translate.instant(helptextGlobal.human_readable.suggestion_label);
    }

    return this.translate.instant(helpTextQuotas.groups.data_quota.placeholder)
      + this.translate.instant(helptextGlobal.human_readable.suggestion_label);
  }

  get objectQuotaLabel(): string {
    return this.quotaType === DatasetQuotaType.User
      ? helpTextQuotas.users.obj_quota.placeholder
      : helpTextQuotas.groups.obj_quota.placeholder;
  }

  get dataQuotaTooltip(): string {
    return this.quotaType === DatasetQuotaType.User
      ? this.translate.instant(helpTextQuotas.users.data_quota.tooltip)
      + ' ' + this.translate.instant(helpTextQuotas.field_accepts_tooltip)
      : this.translate.instant(helpTextQuotas.groups.data_quota.tooltip)
        + ' ' + this.translate.instant(helpTextQuotas.field_accepts_tooltip);
  }

  get objectQuotaTooltip(): string {
    return this.quotaType === DatasetQuotaType.User
      ? helpTextQuotas.users.obj_quota.tooltip
      : helpTextQuotas.groups.obj_quota.tooltip;
  }

  form = this.formBuilder.group({
    data_quota: [null as number],
    obj_quota: [null as number],
    users: [[] as string[]],
    groups: [[] as string[]],
  });

  readonly tooltips = {
    users: helpTextQuotas.users.tooltip,
    groups: helpTextQuotas.groups.tooltip,
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
    private snackbar: SnackbarService,
    private translate: TranslateService,
    public formatter: IxFormatterService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private userService: UserService,
    private slideInRef: SlideInRef<DatasetQuotaAddFormComponent>,
    @Inject(SLIDE_IN_DATA) private slideInData: { quotaType: DatasetQuotaType; datasetId: string },
  ) {}

  ngOnInit(): void {
    this.quotaType = this.slideInData.quotaType;
    this.datasetId = this.slideInData.datasetId;
    this.setupAddQuotaForm();
  }

  setupAddQuotaForm(): void {
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    this.isLoading = true;

    const quotas = this.getQuotas();
    this.ws.call('pool.dataset.set_quota', [this.datasetId, quotas])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.snackbar.success(this.translate.instant('Quotas added'));
          this.isLoading = false;
          this.slideInRef.close(true);
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
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
        throw new Error(`Unexpected quota type: ${this.quotaType}`);
    }

    return quotas;
  }
}
