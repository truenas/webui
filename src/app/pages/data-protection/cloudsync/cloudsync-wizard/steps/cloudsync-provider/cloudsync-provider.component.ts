import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, combineLatest, of, switchMap } from 'rxjs';
import { CloudsyncProviderName, cloudsyncProviderNameMap } from 'app/enums/cloudsync-provider.enum';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import { CloudsyncCredential, CloudsyncCredentialUpdate } from 'app/interfaces/cloudsync-credential.interface';
import { CloudsyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { Option } from 'app/interfaces/option.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { forbiddenValues } from 'app/modules/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { BaseProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';
import { getName, getProviderFormClass } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/steps/cloudsync-provider/cloudsync-provider.common';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-cloudsync-provider',
  templateUrl: './cloudsync-provider.component.html',
  styleUrls: ['./cloudsync-provider.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudsyncProviderComponent implements OnInit {
  @Output() save = new EventEmitter<CloudsyncCredential>();

  form = this.formBuilder.group({
    name: ['Storj', Validators.required],
    provider: [CloudsyncProviderName.Storj],
    exist_credential: [null as number],
  });

  isLoading$ = new BehaviorSubject(false);
  providers: CloudsyncProvider[] = [];
  credentials: CloudsyncCredential[] = [];
  providerOptions$: Observable<Option[]>;
  providerForm: BaseProviderFormComponent;
  forbiddenNames: string[] = [];
  existCredentialOptions$: Observable<Option[]>;
  googleDriveProviderId: number;
  existingCredential: CloudsyncCredential;

  @ViewChild('providerFormContainer', { static: true, read: ViewContainerRef }) providerFormContainer: ViewContainerRef;

  readonly helptext = helptext;

  get isNew(): boolean {
    return !this.existingCredential;
  }

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
  ) {}

  get selectedProvider(): CloudsyncProvider {
    return this.providers?.find((provider) => {
      return provider.name === this.form.controls.provider.value;
    });
  }

  get areActionsDisabled(): boolean {
    return this.isLoading$.value
      || this.form.invalid
      || this.providerForm?.form?.invalid;
  }

  ngOnInit(): void {
    this.setFormEvents();
    this.loadProviders();

    if (this.existingCredential) {
      this.setCredentialsForEdit();
    }
  }

  onSubmit(): boolean {
    this.isLoading$.next(true);

    if (this.existingCredential) {
      this.save.emit(this.existingCredential);
      this.isLoading$.next(false);
      this.cdr.markForCheck();
      return false;
    }

    const beforeSubmit$ = this.providerForm.beforeSubmit();

    beforeSubmit$
      .pipe(
        switchMap(() => {
          const payload = this.getPayload();
          return this.isNew
            ? this.ws.call('cloudsync.credentials.create', [payload])
            : this.ws.call('cloudsync.credentials.update', [this.existingCredential.id, payload]);
        }),
        untilDestroyed(this),
      )
      .subscribe({
        next: (credential) => {
          this.isLoading$.next(false);
          this.snackbarService.success(
            this.isNew
              ? this.translate.instant('Cloud credential added.')
              : this.translate.instant('Cloud credential updated.'),
          );
          this.save.emit(credential);
          this.cdr.markForCheck();
        },
        error: (error) => {
        // TODO: Errors for nested provider form will be shown in a modal. Can be improved.
          this.isLoading$.next(false);
          this.formErrorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });

    return false;
  }

  getPayload(): CloudsyncCredentialUpdate {
    const commonValues = this.form.value;
    return {
      name: commonValues.name,
      provider: commonValues.provider,
      attributes: this.providerForm.getSubmitAttributes(),
    };
  }

  setCredentialsForEdit(): void {
    this.form.controls.name.clearValidators();
    this.form.patchValue({
      provider: this.existingCredential.provider,
      name: this.existingCredential.name,
    });

    if (this.providerForm) {
      this.providerForm.getFormSetter$().next(this.existingCredential.attributes);
    }
  }

  onVerify(): void {
    this.isLoading$.next(true);

    const beforeSubmit$ = this.providerForm.beforeSubmit();

    beforeSubmit$
      .pipe(
        switchMap(() => {
          const { name, ...payload } = this.getPayload();
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

          this.isLoading$.next(false);
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isLoading$.next(false);
          this.formErrorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }

  private loadProviders(): void {
    this.isLoading$.next(true);
    combineLatest([
      this.cloudCredentialService.getProviders(),
      this.cloudCredentialService.getCloudsyncCredentials(),
    ])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: ([providers, credentials]) => {
          this.providers = providers;
          this.credentials = credentials;
          this.providerOptions$ = of(providers.map((provider) => ({
            label: provider.title,
            value: provider.name,
          })));
          this.existCredentialOptions$ = of(credentials.map((credential) => {
            if (credential.provider === CloudsyncProviderName.GoogleDrive) {
              this.googleDriveProviderId = credential.id;
            }

            return {
              label: `${credential.name} (${cloudsyncProviderNameMap.get(credential.provider)})`,
              value: credential.id,
            };
          }).sort((a, b) => a.label.localeCompare(b.label)));
          this.setNamesInUseValidator(credentials);
          this.renderProviderForm();
          this.isLoading$.next(false);
          this.cdr.markForCheck();
        },
        error: (error: WebsocketError) => {
          this.isLoading$.next(false);
          this.dialogService.error(this.errorHandler.parseWsError(error));
        },
      });
  }

  private setNamesInUseValidator(credentials: CloudsyncCredential[]): void {
    this.forbiddenNames = credentials.map((credential) => credential.name);
    this.form.controls.name.addValidators(forbiddenValues(this.forbiddenNames));
  }

  private setFormEvents(): void {
    this.form.controls.provider.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.renderProviderForm();
        this.setDefaultName();
      });

    this.form.controls.exist_credential.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((credentialId) => {
        this.existingCredential = this.credentials.find((credential) => credential.id === credentialId);
        this.renderProviderForm();
        this.setCredentialsForEdit();
      });
  }

  private setDefaultName(): void {
    if (!this.form.controls.provider.value) {
      return;
    }

    const name = getName(cloudsyncProviderNameMap.get(this.form.controls.provider.value), this.forbiddenNames);
    this.form.controls.name.setValue(name);
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
