import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Optional,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { CipherType } from 'app/enums/cipher-type.enum';
import { SshConnectionsSetupMethod } from 'app/enums/ssh-connections-setup-method.enum';
import { idNameArrayToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/system/ssh-connections';
import {
  KeychainCredentialUpdate,
  KeychainSshCredentials,
} from 'app/interfaces/keychain-credential.interface';
import { SshConnectionSetup } from 'app/interfaces/ssh-connection-setup.interface';
import { SshCredentials } from 'app/interfaces/ssh-credentials.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { AppLoaderService, KeychainCredentialService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

const generateNewKeyValue = 'GENERATE_NEW_KEY';

@UntilDestroy()
@Component({
  templateUrl: './ssh-connection-form.component.html',
  styleUrls: ['./ssh-connection-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SshConnectionFormComponent {
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
    password: ['', this.validatorsService.validateOnCondition(
      (control) => control.parent && !this.isManualSetup,
      Validators.required,
    )],
    otp_token: [''],
    private_key: [null as (number | typeof generateNewKeyValue), Validators.required],

    cipher: [CipherType.Standard],
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
    return this.form.get('setup_method').value === SshConnectionsSetupMethod.Manual;
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

  readonly ciphers$ = of([
    {
      label: 'Standard',
      value: CipherType.Standard,
    }, {
      label: 'Fast',
      value: CipherType.Fast,
    }, {
      label: 'Disabled',
      value: CipherType.Disabled,
    },
  ]);

  readonly helptext = helptext;

  private existingConnection: KeychainSshCredentials;

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private keychainCredentialService: KeychainCredentialService,
    private loader: AppLoaderService,
    private validatorsService: IxValidatorsService,
    private slideIn: IxSlideInService,
    @Optional() public dialogRef: MatDialogRef<SshConnectionFormComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: { dialog: boolean },
  ) {}

  get isManualAuthFormValid(): boolean {
    return this.form.controls['host'].valid
      && this.form.controls['private_key'].valid
      && this.form.controls['username'].valid;
  }

  setConnectionForEdit(connection: KeychainSshCredentials): void {
    this.existingConnection = connection;
    this.form.patchValue({
      ...connection.attributes,
      connection_name: connection.name,
      setup_method: SshConnectionsSetupMethod.Manual,
    });
    this.cdr.markForCheck();
  }

  onDiscoverRemoteHostKeyPressed(): void {
    this.loader.open();
    const requestParams = {
      host: this.form.get('host').value,
      port: this.form.get('port').value,
      connect_timeout: this.form.get('connect_timeout').value,
    };

    this.ws.call('keychaincredential.remote_ssh_host_key_scan', [requestParams])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (remoteHostKey) => {
          this.loader.close();
          this.form.patchValue({
            remote_host_key: remoteHostKey,
          });
        },
        error: (error) => {
          this.loader.close();
          this.errorHandler.handleWsFormError(error, this.form);
        },
      });
  }

  onSubmit(): void {
    this.isLoading = true;

    const request$: Observable<unknown> = this.isNew
      ? this.prepareSetupRequest()
      : this.prepareUpdateRequest();

    request$.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.isLoading = false;
        if (this.data?.dialog) {
          if (this.dialogRef) {
            this.dialogRef.close();
          }
        } else {
          this.slideIn.close();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.errorHandler.handleWsFormError(error, this.form);
      },
    });
  }

  private prepareSetupRequest(): Observable<unknown> {
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
        cipher: values.cipher,
        connect_timeout: values.connect_timeout,
      } as SshCredentials;
    } else {
      params.semi_automatic_setup = {
        url: values.url,
        password: values.password,
        username: values.username,
        otp_token: values.otp_token,
        connect_timeout: values.connect_timeout,
        cipher: values.cipher,
      };
    }

    return this.ws.call('keychaincredential.setup_ssh_connection', [params]);
  }

  private prepareUpdateRequest(): Observable<unknown> {
    const values = this.form.value;
    const params: KeychainCredentialUpdate = {
      name: values.connection_name,
      attributes: {
        host: values.host,
        port: values.port,
        username: values.username,
        private_key: values.private_key,
        remote_host_key: values.remote_host_key,
        cipher: values.cipher,
        connect_timeout: values.connect_timeout,
      } as SshCredentials,
    };

    return this.ws.call('keychaincredential.update', [this.existingConnection.id, params]);
  }
}
