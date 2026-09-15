import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, ViewContainerRef, viewChild,
  signal, inject, input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { combineLatest, of, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { Role } from 'app/enums/role.enum';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import { CloudSyncCredential, CloudSyncCredentialUpdate } from 'app/interfaces/cloudsync-credential.interface';
import { CloudSyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import { IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { forbiddenValues } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';
import { CloudSyncProviderDescriptionComponent } from 'app/pages/data-protection/cloudsync/cloudsync-provider-description/cloudsync-provider-description.component';
import { getName, getProviderFormClass } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/steps/cloudsync-provider/cloudsync-provider.common';
import { CloudCredentialService } from 'app/services/cloud-credential.service';

export interface CloudCredentialFormInput {
  providers: CloudSyncProviderName[];
  existingCredential: CloudSyncCredential;
}

// TODO: Form is partially backend driven and partially hardcoded on the frontend.
@Component({
  selector: 'ix-cloud-credentials-form',
  templateUrl: './cloud-credentials-form.component.html',
  styleUrls: ['./cloud-credentials-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnSelectComponent,
    CloudSyncProviderDescriptionComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class CloudCredentialsFormComponent extends IxFormHostForm<CloudSyncCredential | null> implements OnInit {
  private api = inject(ApiService);
  private formBuilder = inject(FormBuilder);
  private dialogService = inject(DialogService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private translate = inject(TranslateService);
  private snackbarService = inject(SnackbarService);
  private cloudCredentialService = inject(CloudCredentialService);
  private destroyRef = inject(DestroyRef);

  readonly requiredRoles = [Role.CloudSyncWrite];

  /** Data supplied by the `<tn-side-panel>` host (undefined = create with no provider limit). */
  readonly editInput = input<CloudCredentialFormInput | undefined>(undefined);

  commonForm = this.formBuilder.nonNullable.group({
    name: ['Storj', Validators.required],
    type: [CloudSyncProviderName.Storj],
  });

  // The group the inner `<ix-form>` owns. The provider sub-form is rendered dynamically alongside
  // it and is not part of it, so `canSubmit` / `hasUnsavedChanges` are widened below.
  protected readonly form = this.commonForm;

  /** A "Verify Credential" round-trip — neither a config load nor a save, so tracked separately. */
  private readonly isVerifying = signal(false);

  // Mirrors the dynamically-created provider sub-form's validity into a signal so the
  // `<tn-side-panel>` host's footer Save can react to it (its child validity isn't otherwise
  // observable from the outside). Re-tracked whenever the provider form is re-rendered.
  private providerFormValid = signal(false);
  private providerFormStatusSub?: Subscription;

  /** Folds the verify round-trip into the panel's progress bar. */
  override isBusy(): boolean {
    return super.isBusy() || this.isVerifying();
  }

  /** Widened: the payload also needs the dynamic provider sub-form to be valid. */
  override canSubmit(): boolean {
    return !this.isVerifying() && this.providerFormValid() && super.canSubmit();
  }

  existingCredential: CloudSyncCredential;
  limitProviders: CloudSyncProviderName[];
  providers: CloudSyncProvider[] = [];
  providerOptions = of<Option[]>([]);
  providerForm: BaseProviderFormComponent;
  forbiddenNames: string[] = [];
  credentials: CloudSyncCredential[] = [];

  private readonly providerFormContainer = viewChild.required('providerFormContainer', { read: ViewContainerRef });

  readonly helptext = helptext;

  /**
   * Host hook (`<tn-side-panel>` closeGuard) to confirm before discarding unsaved edits. Overrides
   * the base's single-form check to also account for the dynamic provider sub-form.
   */
  override hasUnsavedChanges(): boolean {
    return super.hasUnsavedChanges() || Boolean(this.providerForm?.form?.dirty);
  }

  get showProviderDescription(): boolean {
    return this.commonForm.controls.type.enabled
      && this.commonForm.controls.type.value === CloudSyncProviderName.Storj;
  }

  get isNew(): boolean {
    return !this.existingCredential;
  }

  get selectedProvider(): CloudSyncProvider | undefined {
    return this.providers?.find((provider) => {
      return provider.name === this.commonForm.controls.type.value;
    });
  }

  get areActionsDisabled(): boolean {
    return this.isBusy()
      || this.commonForm.invalid
      || this.providerForm?.form?.invalid;
  }

  ngOnInit(): void {
    const data = this.editInput();
    this.existingCredential = data?.existingCredential;
    this.limitProviders = data?.providers;
    // Has to be earlier than potential `setCredentialsForEdit` call
    this.setFormEvents();

    this.loadProviders();

    if (this.existingCredential) {
      this.setCredentialsForEdit();
    }
  }

  setCredentialsForEdit(): void {
    this.commonForm.setValue({
      name: this.existingCredential.name,
      type: this.existingCredential.provider.type,
    });

    if (this.providerForm) {
      this.providerForm.getFormSetter$().next(this.existingCredential.provider);
    }
  }

  // TODO: Errors raised by the nested provider form still surface in a modal rather than on the
  // offending control — `<ix-form>` can only map validation errors onto the group it owns.
  protected handleSubmit = (): SubmitResult<CloudSyncCredential | null, CloudSyncCredential> => ({
    request$: this.providerForm.beforeSubmit().pipe(
      switchMap(() => {
        const payload = this.preparePayload();
        return this.isNew
          ? this.api.call('cloudsync.credentials.create', [payload])
          : this.api.call('cloudsync.credentials.update', [this.existingCredential.id, payload]);
      }),
    ),
    successMessage: this.isNew
      ? this.translate.instant('Cloud credential added.')
      : this.translate.instant('Cloud credential updated.'),
    // Richer payload than the default boolean — hand back the saved credential so
    // `ix-cloud-credentials-select` can auto-select it.
    closeWith: (credential) => credential,
  });

  protected onVerify(): void {
    this.isVerifying.set(true);

    this.providerForm.beforeSubmit()
      .pipe(
        switchMap(() => {
          const payload = this.preparePayload();

          return this.api.call('cloudsync.credentials.verify', [payload.provider]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          if (response.valid) {
            this.snackbarService.success(this.translate.instant('The credentials are valid.'));
          } else {
            this.dialogService.error({
              title: this.translate.instant('Error'),
              message: response.excerpt || '',
              stackTrace: response.error,
            });
          }

          this.isVerifying.set(false);
        },
        error: (error: unknown) => {
          this.isVerifying.set(false);
          this.formErrorHandler.handleValidationErrors(error, this.commonForm);
        },
      });
  }

  private preparePayload(): CloudSyncCredentialUpdate {
    const commonValues = this.commonForm.getRawValue();
    return {
      name: commonValues.name,
      provider: {
        ...this.providerForm.getSubmitAttributes(),
        type: commonValues.type,
      },
    };
  }

  private loadProviders(): void {
    this.loadFormConfig(
      combineLatest([
        this.cloudCredentialService.getProviders(),
        this.cloudCredentialService.getCloudSyncCredentials(),
      ]),
      ([allProviders, credentials]) => {
        const providers = this.limitProviders?.length
          ? allProviders.filter((provider) => this.limitProviders.includes(provider.name))
          : allProviders;
        this.providers = providers;
        this.providerOptions = of(
          providers.map((provider) => ({
            label: provider.title,
            value: provider.name,
          })),
        );
        this.credentials = credentials;
        this.setNamesInUseValidator(credentials);
        this.renderProviderForm();
        if (this.existingCredential) {
          this.providerForm.getFormSetter$().next(this.existingCredential.provider);
        }
      },
    );
  }

  private setFormEvents(): void {
    this.commonForm.controls.type.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.renderProviderForm();

        this.setDefaultName();
      });
  }

  // `setValidators`, not `addValidators`: this runs from the `loadFormConfig` patch, which replays
  // on retry, and appending would stack a second forbidden-values validator each time.
  private setNamesInUseValidator(credentials: CloudSyncCredential[]): void {
    this.forbiddenNames = credentials.map((credential) => credential.name);
    this.commonForm.controls.name.setValidators([
      Validators.required,
      forbiddenValues(this.forbiddenNames),
    ]);
    this.commonForm.controls.name.updateValueAndValidity();
  }

  private setDefaultName(): void {
    if (!this.isNew || this.commonForm.controls.name.touched) {
      return;
    }

    this.commonForm.controls.name.setValue(getName(this.selectedProvider?.title || '', this.forbiddenNames));
  }

  private renderProviderForm(): void {
    this.providerFormContainer()?.clear();
    if (!this.selectedProvider) {
      return;
    }

    const formClass = getProviderFormClass(this.selectedProvider.name);
    const formRef = this.providerFormContainer().createComponent(formClass);
    formRef.instance.provider = this.selectedProvider;
    this.providerForm = formRef.instance;
    this.trackProviderFormValidity();
  }

  /** Keeps {@link providerFormValid} in sync with the current provider sub-form's status. */
  private trackProviderFormValidity(): void {
    this.providerFormStatusSub?.unsubscribe();
    const providerControl = this.providerForm?.form;
    if (!providerControl) {
      this.providerFormValid.set(false);
      return;
    }
    this.providerFormValid.set(providerControl.valid);
    this.providerFormStatusSub = providerControl.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.providerFormValid.set(providerControl.valid));
  }
}
