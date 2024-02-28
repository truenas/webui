import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { Role } from 'app/enums/role.enum';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import { CloudSyncCredential, CloudSyncCredentialUpdate } from 'app/interfaces/cloudsync-credential.interface';
import { CloudSyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { forbiddenValues } from 'app/modules/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';
import { getName, getProviderFormClass } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/steps/cloudsync-provider/cloudsync-provider.common';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

// TODO: Form is partially backend driven and partially hardcoded on the frontend.
@UntilDestroy()
@Component({
  templateUrl: './cloud-credentials-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudCredentialsFormComponent implements OnInit {
  protected requiredRoles = [Role.CloudSyncWrite];

  commonForm = this.formBuilder.group({
    name: ['Storj', Validators.required],
    provider: [CloudSyncProviderName.Storj],
  });

  isLoading = false;
  existingCredential: CloudSyncCredential;
  providers: CloudSyncProvider[] = [];
  providerOptions = of<Option[]>([]);
  providerForm: BaseProviderFormComponent;
  forbiddenNames: string[] = [];
  credentials: CloudSyncCredential[] = [];

  @ViewChild('providerFormContainer', { static: true, read: ViewContainerRef }) providerFormContainer: ViewContainerRef;

  readonly helptext = helptext;

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private formErrorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private snackbarService: SnackbarService,
    private cloudCredentialService: CloudCredentialService,
    private chainedRef: ChainedRef<CloudSyncCredential>,
  ) {
    this.existingCredential = this.chainedRef.getData();
    // Has to be earlier than potential `setCredentialsForEdit` call
    this.setFormEvents();
  }

  get showProviderDescription(): boolean {
    return this.commonForm.controls.provider.enabled
      && this.commonForm.controls.provider.value === CloudSyncProviderName.Storj;
  }

  get isNew(): boolean {
    return !this.existingCredential;
  }

  get selectedProvider(): CloudSyncProvider {
    return this.providers?.find((provider) => {
      return provider.name === this.commonForm.controls.provider.value;
    });
  }

  get areActionsDisabled(): boolean {
    return this.isLoading
      || this.commonForm.invalid
      || this.providerForm?.form?.invalid;
  }

  ngOnInit(): void {
    this.loadProviders();

    if (this.existingCredential) {
      this.setCredentialsForEdit();
    }
  }

  setCredentialsForEdit(): void {
    this.commonForm.patchValue(this.existingCredential);

    if (this.providerForm) {
      this.providerForm.getFormSetter$().next(this.existingCredential.attributes);
    }
  }

  onSubmit(): boolean {
    this.isLoading = true;

    this.providerForm.beforeSubmit()
      .pipe(
        switchMap(() => {
          const payload = this.preparePayload();
          return this.isNew
            ? this.ws.call('cloudsync.credentials.create', [payload])
            : this.ws.call('cloudsync.credentials.update', [this.existingCredential.id, payload]);
        }),
        untilDestroyed(this),
      )
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.snackbarService.success(
            this.isNew
              ? this.translate.instant('Cloud credential added.')
              : this.translate.instant('Cloud credential updated.'),
          );
          this.chainedRef.close({ response, error: null });
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          // TODO: Errors for nested provider form will be shown in a modal. Can be improved.
          this.isLoading = false;
          this.formErrorHandler.handleWsFormError(error, this.commonForm);
          this.cdr.markForCheck();
        },
      });

    return false;
  }

  onVerify(): void {
    this.isLoading = true;

    this.providerForm.beforeSubmit()
      .pipe(
        switchMap(() => {
          const { name, ...payload } = this.preparePayload();

          return this.ws.call('cloudsync.credentials.verify', [payload]);
        }),
        untilDestroyed(this),
      )
      .subscribe({
        next: (response) => {
          if (response.valid) {
            this.snackbarService.success(this.translate.instant('The credentials are valid.'));
          } else {
            this.dialogService.error({
              title: this.translate.instant('Error'),
              message: response.excerpt,
              backtrace: response.error,
            });
          }

          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.isLoading = false;
          this.formErrorHandler.handleWsFormError(error, this.commonForm);
          this.cdr.markForCheck();
        },
      });
  }

  private preparePayload(): CloudSyncCredentialUpdate {
    const commonValues = this.commonForm.value;
    return {
      name: commonValues.name,
      provider: commonValues.provider,
      attributes: this.providerForm.getSubmitAttributes(),
    };
  }

  private loadProviders(): void {
    this.isLoading = true;
    combineLatest([
      this.cloudCredentialService.getProviders(),
      this.cloudCredentialService.getCloudSyncCredentials(),
    ])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: ([providers, credentials]) => {
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
            this.providerForm.getFormSetter$().next(this.existingCredential.attributes);
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.dialogService.error(this.errorHandler.parseError(error));
        },
      });
  }

  private setFormEvents(): void {
    this.commonForm.controls.provider.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.renderProviderForm();

        this.setDefaultName();
      });
  }

  private setNamesInUseValidator(credentials: CloudSyncCredential[]): void {
    this.forbiddenNames = credentials.map((credential) => credential.name);
    this.commonForm.controls.name.addValidators(forbiddenValues(this.forbiddenNames));
  }

  private setDefaultName(): void {
    if (!this.isNew || this.commonForm.controls.name.touched) {
      return;
    }

    this.commonForm.controls.name.setValue(getName(this.selectedProvider.title, this.forbiddenNames));
  }

  private renderProviderForm(): void {
    this.providerFormContainer?.clear();
    if (!this.selectedProvider) {
      return;
    }

    const formClass = getProviderFormClass(this.selectedProvider.name);
    const formRef = this.providerFormContainer.createComponent(formClass);
    formRef.instance.provider = this.selectedProvider;
    this.providerForm = formRef.instance;
  }
}
