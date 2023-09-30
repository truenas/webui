import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, Optional,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';
import {
  catchError, map, switchMap,
} from 'rxjs/operators';
import { SshConnectionsSetupMethod } from 'app/enums/ssh-connections-setup-method.enum';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import helptext from 'app/helptext/system/ssh-connections';
import {
  KeychainCredential,
  KeychainCredentialUpdate,
  KeychainSshCredentials,
} from 'app/interfaces/keychain-credential.interface';
import { SshConnectionSetup } from 'app/interfaces/ssh-connection-setup.interface';
import { SshCredentials } from 'app/interfaces/ssh-credentials.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { KeychainCredentialService } from 'app/services/keychain-credential.service';
import { WebSocketService } from 'app/services/ws.service';

const generateNewKeyValue = 'GENERATE_NEW_KEY';
const sslCertificationError = 'ESSLCERTVERIFICATIONERROR';

@UntilDestroy()
@Component({
  templateUrl: './ssh-connection-form.component.html',
  styleUrls: ['./ssh-connection-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SshConnectionFormComponent implements OnInit {
  form = this.formBuilder.group({
    connection_name: ['', Validators.required],
    setup_method: [SshConnectionsSetupMethod.SemiAutomatic],

    host: ['', this.validatorsService.validateOnCondition(
      (control) => control.parent && this.isManualSetup,
      Validators.required,
    )],
    port: [22, this.validatorsService.validateOnCondition(
      (control) => control.parent && this.isManualSetup,
      Validators.required,
    )],
    remote_host_key: [''],

    url: ['', this.validatorsService.validateOnCondition(
      (control) => control.parent && !this.isManualSetup,
      Validators.required,
    )],

    username: ['root', Validators.required],
    admin_username: ['root'],
    password: ['', this.validatorsService.validateOnCondition(
      (control) => control.parent && !this.isManualSetup,
      Validators.required,
    )],
    sudo: [false],
    otp_token: [''],
    private_key: [null as (number | typeof generateNewKeyValue), Validators.required],

    connect_timeout: [10],
  });

  get isNew(): boolean {
    return !this.existingConnection;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('New SSH Connection')
      : this.translate.instant('Edit SSH Connection');
  }

  get isManualSetup(): boolean {
    return this.form.controls.setup_method.value === SshConnectionsSetupMethod.Manual;
  }

  isLoading = false;

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
    map((keyOptions) => {
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

  readonly helptext = helptext;

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private formErrorHandler: FormErrorHandlerService,
    private errorHandler: ErrorHandlerService,
    private keychainCredentialService: KeychainCredentialService,
    private loader: AppLoaderService,
    private validatorsService: IxValidatorsService,
    private slideInRef: IxSlideInRef<SshConnectionFormComponent>,
    public formatter: IxFormatterService,
    private dialogService: DialogService,
    private snackbar: SnackbarService,
    @Optional() public dialogRef: MatDialogRef<SshConnectionFormComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: { dialog: boolean },
    @Inject(SLIDE_IN_DATA) private existingConnection: KeychainSshCredentials,
  ) { }

  ngOnInit(): void {
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
    this.cdr.markForCheck();
  }

  onDiscoverRemoteHostKeyPressed(): void {
    const requestParams = {
      host: this.form.controls.host.value,
      port: this.form.controls.port.value,
      connect_timeout: this.form.controls.connect_timeout.value,
    };

    this.ws.call('keychaincredential.remote_ssh_host_key_scan', [requestParams])
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: (remoteHostKey) => {
          this.form.patchValue({
            remote_host_key: remoteHostKey,
          });
        },
        error: (error) => {
          this.formErrorHandler.handleWsFormError(error, this.form);
        },
      });
  }

  onSubmit(): void {
    this.isLoading = true;

    const request$: Observable<KeychainCredential> = this.isNew
      ? this.prepareSetupRequest()
      : this.prepareUpdateRequest();

    request$.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (newCredential) => {
        this.isLoading = false;
        this.snackbar.success(this.translate.instant('SSH Connection saved'));
        // TODO: Ideally this form shouldn't care about how it was called
        if (this.data?.dialog) {
          if (this.dialogRef) {
            this.dialogRef.close(newCredential);
          }
        } else {
          this.slideInRef.close(newCredential);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.formErrorHandler.handleWsFormError(error, this.form);
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
        url: values.url,
        admin_username: values.admin_username,
        password: values.password,
        username: values.username,
        otp_token: values.otp_token,
        connect_timeout: values.connect_timeout,
        sudo: values.sudo,
      };
    }

    return this.ws.call('keychaincredential.setup_ssh_connection', [params]).pipe(
      catchError((error: WebsocketError) => {
        if (error.errname.includes(sslCertificationError) || error.reason.includes(sslCertificationError)) {
          return this.dialogService.error(this.errorHandler.parseWsError(error)).pipe(
            switchMap(() => {
              return this.dialogService.confirm({
                title: this.translate.instant('Confirm'),
                message: this.translate.instant('Would you like to ignore this error and try again?'),
              });
            }),
            switchMap((retry) => {
              if (retry) {
                params.semi_automatic_setup.verify_ssl = false;
                return this.ws.call('keychaincredential.setup_ssh_connection', [params]);
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

    return this.ws.call('keychaincredential.update', [this.existingConnection.id, params]);
  }
}
