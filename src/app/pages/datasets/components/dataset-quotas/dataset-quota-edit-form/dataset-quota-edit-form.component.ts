import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject, input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslateService } from '@ngx-translate/core';
import {
  InputType, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import {
  EMPTY, Observable, of, switchMap,
} from 'rxjs';
import { catchError, filter, tap } from 'rxjs/operators';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { Role } from 'app/enums/role.enum';
import { helptextGlobal } from 'app/helptext/global-helptext';
import { helptextQuotas } from 'app/helptext/storage/volumes/datasets/dataset-quotas';
import { DatasetQuota, SetDatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { QueryFilter, QueryParams } from 'app/interfaces/query-api.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-dataset-quota-edit-form',
  templateUrl: './dataset-quota-edit-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
  ],
})
export class DatasetQuotaEditFormComponent extends IxFormHostForm implements OnInit {
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private errorHandler = inject(FormErrorHandlerService);
  protected dialogService = inject(DialogService);
  private destroyRef = inject(DestroyRef);

  /** Context supplied by the `<tn-side-panel>` host (via {@link FormSidePanelService}). */
  readonly datasetId = input.required<string>();
  readonly quotaType = input.required<DatasetQuotaType>();
  readonly quotaId = input.required<number>();

  protected readonly requiredRoles = [Role.DatasetWrite];
  protected readonly InputType = InputType;

  protected isFormLoading = signal(false);
  private datasetQuota: DatasetQuota;

  protected get nameLabel(): string {
    return this.quotaType() === DatasetQuotaType.User
      ? this.translate.instant(helptextQuotas.users.nameLabel)
      : this.translate.instant(helptextQuotas.groups.nameLabel);
  }

  protected get dataQuotaLabel(): string {
    return this.quotaType() === DatasetQuotaType.User
      ? this.getUserDataQuotaLabel()
      : this.getGroupDataQuotaLabel();
  }

  private getUserDataQuotaLabel(): string {
    return this.translate.instant(helptextQuotas.users.dataQuota.label)
      + this.translate.instant(helptextGlobal.humanReadable.suggestionLabel);
  }

  private getGroupDataQuotaLabel(): string {
    return this.translate.instant(helptextQuotas.groups.dataQuota.label)
      + this.translate.instant(helptextGlobal.humanReadable.suggestionLabel);
  }

  protected get objectQuotaLabel(): string {
    return this.quotaType() === DatasetQuotaType.User
      ? this.translate.instant(helptextQuotas.users.objQuota.label)
      : this.translate.instant(helptextQuotas.groups.objectQuota.label);
  }

  protected get dataQuotaTooltip(): string {
    return this.quotaType() === DatasetQuotaType.User
      ? this.getUserDataQuotaTooltip()
      : this.getGroupDataQuotaTooltip();
  }

  private getUserDataQuotaTooltip(): string {
    return this.translate.instant(helptextQuotas.users.dataQuota.tooltip)
      + this.translate.instant(helptextGlobal.humanReadable.suggestionTooltip)
      + this.translate.instant(' bytes.');
  }

  private getGroupDataQuotaTooltip(): string {
    return this.translate.instant(helptextQuotas.groups.dataQuota.tooltip)
      + this.translate.instant(helptextGlobal.humanReadable.suggestionTooltip)
      + this.translate.instant(' bytes.');
  }

  protected get objectQuotaTooltip(): string {
    return this.quotaType() === DatasetQuotaType.User
      ? this.translate.instant(helptextQuotas.users.objQuota.tooltip)
      : this.translate.instant(helptextQuotas.groups.objectQuota.tooltip);
  }

  protected form = this.formBuilder.group({
    name: [''],
    data_quota: new FormControl(null as number | null),
    obj_quota: new FormControl(null as number | null),
  });

  ngOnInit(): void {
    this.updateForm();
  }

  private updateForm(): void {
    this.isFormLoading.set(true);
    this.getQuota(this.quotaId()).pipe(
      tap((quotas) => {
        this.datasetQuota = quotas[0];
        this.isFormLoading.set(false);
        this.form.patchValue({
          name: this.datasetQuota.name || '',
          data_quota: this.datasetQuota.quota || null,
          obj_quota: this.datasetQuota.obj_quota,
        });
      }),
      catchError((error: unknown) => {
        this.isFormLoading.set(false);
        this.errorHandler.handleValidationErrors(error, this.form);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  private getQuota(id: number): Observable<DatasetQuota[]> {
    const params = [['id', '=', id] as QueryFilter<DatasetQuota>] as QueryParams<DatasetQuota>;
    return this.api.call('pool.dataset.get_quota', [this.datasetId(), this.quotaType(), params]);
  }

  protected handleSubmit = (_: FormSubmitEvent): SubmitResult => {
    const values = this.form.value;
    const payload: SetDatasetQuota[] = [];
    payload.push({
      quota_type: this.quotaType(),
      id: String(this.datasetQuota.id),
      quota_value: values.data_quota || 0,
    });
    payload.push({
      quota_type: this.quotaType() === DatasetQuotaType.User
        ? DatasetQuotaType.UserObj
        : DatasetQuotaType.GroupObj,
      id: String(this.datasetQuota.id),
      quota_value: values.obj_quota || 0,
    });

    // When both quotas are unset, confirm before submitting. A cancelled
    // confirmation completes the stream without emitting, so `<ix-form>` leaves
    // the panel open (its success path only runs on `next`).
    const canSubmit$ = this.isUnsettingQuota(values) ? this.getConfirmation(values.name) : of(true);
    const request$ = canSubmit$.pipe(
      filter(Boolean),
      switchMap(() => this.api.call('pool.dataset.set_quota', [this.datasetId(), payload])),
    );

    return {
      request$,
      successMessage: this.translate.instant('Quotas updated'),
    };
  };

  private isUnsettingQuota(values: typeof this.form.value): boolean {
    return !values.data_quota && !values.obj_quota;
  }

  private getConfirmation(name: string): Observable<boolean> {
    return this.dialogService.confirm({
      title: this.quotaType() === DatasetQuotaType.User
        ? this.translate.instant('Delete User Quota')
        : this.translate.instant('Delete Group Quota'),
      message: this.quotaType() === DatasetQuotaType.User
        ? this.translate.instant('Are you sure you want to delete the user quota <b>{name}</b>?', { name })
        : this.translate.instant('Are you sure you want to delete the group quota <b>{name}</b>?', { name }),
      buttonText: this.translate.instant('Delete'),
      buttonColor: 'warn',
    });
  }
}
