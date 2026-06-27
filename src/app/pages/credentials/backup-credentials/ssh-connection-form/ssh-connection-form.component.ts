import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject, input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType,
  TnButtonComponent,
  TnCheckboxComponent,
  TnFormFieldComponent,
  TnFormSectionComponent,
  TnInputComponent,
  TnSelectComponent,
} from '@truenas/ui-components';
import {
  Observable, of, throwError,
} from 'rxjs';
import {
  catchError, map, switchMap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { SshConnectionsSetupMethod } from 'app/enums/ssh-connections-setup-method.enum';
import { extractApiErrorDetails } from 'app/helpers/api.helper';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextSshConnections } from 'app/helptext/system/ssh-connections';
import {
  KeychainCredential,
  KeychainCredentialUpdate,
  KeychainSshCredentials,
} from 'app/interfaces/keychain-credential.interface';
import { Option } from 'app/interfaces/option.interface';
import { SshConnectionSetup } from 'app/interfaces/ssh-connection-setup.interface';
import { SshCredentials } from 'app/interfaces/ssh-credentials.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { KeychainCredentialService } from 'app/services/keychain-credential.service';

const generateNewKeyValue = 'GENERATE_NEW_KEY';
const sslCertificationError = 'ESSLCERTVERIFICATIONERROR';

@Component({
  selector: 'ix-ssh-connection-form',
  templateUrl: './ssh-connection-form.component.html',
  styleUrls: ['./ssh-connection-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TnSelectComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class SshConnectionFormComponent extends SidePanelForm<KeychainCredential | null> implements OnInit {
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private errorHandler = inject(ErrorHandlerService);
  private keychainCredentialService = inject(KeychainCredentialService);
  private loader = inject(LoaderService);
  private validatorsService = inject(IxValidatorsService);
  formatter = inject(IxFormatterService);
  private dialogService = inject(DialogService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  readonly requiredRoles = [Role.KeychainCredentialWrite];
  protected readonly InputType = InputType;

  /** The record being edited, supplied by the `<tn-side-panel>` host (undefined = create). */
  readonly editConnection = input<KeychainSshCredentials | undefined>(undefined);

  form = this.formBuilder.group({
    connection_name: ['', Validators.required],
    setup_method: [SshConnectionsSetupMethod.SemiAutomatic],

    host: ['', this.validatorsService.validateOnCondition(
      (control) => Boolean(control?.parent) && this.isManualSetup,
      Validators.required,
    )],
    port: [22, this.validatorsService.validateOnCondition(
      (control) => Boolean(control?.parent) && this.isManualSetup,
      Validators.required,
    )],
    remote_host_key: [''],

    url: ['', this.validatorsService.validateOnCondition(
      (control) => Boolean(control?.parent) && !this.isManualSetup,
      Validators.required,
    )],

    username: ['root', Validators.required],
    admin_username: ['root'],
    password: ['', this.validatorsService.validateOnCondition(
      (control) => Boolean(control?.parent) && !this.isManualSetup,
      Validators.required,
    )],
    sudo: [false],
    otp_token: [''],
    private_key: [generateNewKeyValue as (number | typeof generateNewKeyValue), Validators.required],

    connect_timeout: [10],
  });

  get isNew(): boolean {
    return !this.existingConnection;
  }

  get isManualSetup(): boolean {
    return this.form.controls.setup_method.value === SshConnectionsSetupMethod.Manual;
  }

  protected isLoading = signal(false);

  /** Read by the `<tn-side-panel>` host to enable/disable its footer Save action. */
  readonly canSubmit = this.trackCanSubmit(this.isLoading);

  readonly setupMethods$ = of([
    {
      label: this.translate.instant('Manual'),
      value: SshConnectionsSetupMethod.Manual,
    }, {
      label: this.translate.instant('Semi-automatic (TrueNAS only)'),
      value: SshConnectionsSetupMethod.SemiAutomatic,
    },
  ]);

  readonly privateKeys$ = this.keychainCredentialService.getSshKeys().pipe(
    idNameArrayToOptions(),
    // Typed as Option[] (value: string | number | null) so the synchronous `tn-select`
    // accepts both the numeric key ids and the string "Generate New" sentinel.
    map((keyOptions): Option[] => {
      if (!this.isNew) {
        return keyOptions;
      }

      return [
        {
          label: this.translate.instant('Generate New'),
          value: generateNewKeyValue,
        },
        ...keyOptions,
      ];
    }),
  );

  readonly isNotRootUsername$ = this.form.controls.username.valueChanges.pipe(
    map((username) => username !== 'root'),
  );

  readonly helptext = helptextSshConnections;

  private existingConnection: KeychainSshCredentials | undefined;

  ngOnInit(): void {
    this.existingConnection = this.editConnection();
    if (this.existingConnection) {
      this.setConnectionForEdit();
    }
  }

  get isManualAuthFormValid(): boolean {
    return this.form.controls.host.valid
      && this.form.controls.private_key.valid
      && this.form.controls.username.valid;
  }

  setConnectionForEdit(): void {
    this.form.patchValue({
      ...this.existingConnection.attributes,
      connection_name: this.existingConnection.name,
      setup_method: SshConnectionsSetupMethod.Manual,
    });
  }

  onDiscoverRemoteHostKeyPressed(): void {
    const requestParams = {
      host: this.form.controls.host.value,
      port: this.form.controls.port.value,
      connect_timeout: this.form.controls.connect_timeout.value,
    };

    this.api.call('keychaincredential.remote_ssh_host_key_scan', [requestParams])
      .pipe(this.loader.withLoader(), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (remoteHostKey) => {
          this.form.patchValue({
            remote_host_key: remoteHostKey,
          });
        },
        error: (error: unknown) => {
          this.formErrorHandler.handleValidationErrors(error, this.form);
        },
      });
  }

  protected onSubmit(): void {
    this.isLoading.set(true);

    const request$: Observable<KeychainCredential> = this.isNew
      ? this.prepareSetupRequest()
      : this.prepareUpdateRequest();

    request$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (newCredential) => {
        this.isLoading.set(false);
        this.snackbar.success(this.translate.instant('SSH Connection saved'));
        // Richer payload than the base boolean — emit the created/updated credential directly so
        // `ix-ssh-credentials-select` can auto-select it.
        this.closed.emit(newCredential);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }

  private prepareSetupRequest(): Observable<KeychainCredential> {
    const values = this.form.value;

    const params: SshConnectionSetup = {
      setup_type: values.setup_method,
      connection_name: values.connection_name,
      private_key: values.private_key === generateNewKeyValue
        ? { generate_key: true, name: `${values.connection_name} Key` }
        : { generate_key: false, existing_key_id: values.private_key },
    };

    if (values.setup_method === SshConnectionsSetupMethod.Manual) {
      params.manual_setup = {
        host: values.host,
        port: values.port,
        username: values.username,
        remote_host_key: values.remote_host_key,
        connect_timeout: values.connect_timeout,
      } as SshCredentials;
    } else {
      params.semi_automatic_setup = {
        // tn-input has no `[parse]`; normalize the bare URL (prepend protocol) at submit,
        // matching the legacy ix-input `stringAsUrlParsing` behavior.
        url: this.formatter.stringAsUrlParsing(values.url),
        admin_username: values.admin_username,
        password: values.password,
        username: values.username,
        otp_token: values.otp_token,
        connect_timeout: values.connect_timeout,
        sudo: values.sudo,
      };
    }

    return this.keychainCredentialService.addSshConnection(params).pipe(
      catchError((error: unknown) => {
        const apiError = extractApiErrorDetails(error);
        if (apiError?.errname?.includes(sslCertificationError) || apiError?.reason?.includes(sslCertificationError)) {
          return this.errorHandler.showErrorModal(error).pipe(
            switchMap(() => {
              return this.dialogService.confirm({
                title: this.translate.instant('Confirm'),
                message: this.translate.instant('Would you like to ignore this error and try again?'),
              });
            }),
            switchMap((retry) => {
              if (retry) {
                params.semi_automatic_setup.verify_ssl = false;
                return this.keychainCredentialService.addSshConnection(params);
              }
              return throwError(() => error);
            }),
          );
        }
        return throwError(() => error);
      }),
    );
  }

  private prepareUpdateRequest(): Observable<KeychainCredential> {
    const values = this.form.value;
    const params: KeychainCredentialUpdate = {
      name: values.connection_name,
      attributes: {
        host: values.host,
        port: values.port,
        username: values.username,
        private_key: values.private_key,
        remote_host_key: values.remote_host_key,
        connect_timeout: values.connect_timeout,
      } as SshCredentials,
    };

    return this.api.call('keychaincredential.update', [this.existingConnection.id, params]);
  }
}
