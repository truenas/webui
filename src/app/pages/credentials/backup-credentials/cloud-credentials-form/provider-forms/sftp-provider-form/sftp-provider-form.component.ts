import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { idNameArrayToOptions } from 'app/helpers/options.helper';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import { Option } from 'app/interfaces/option.interface';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';
import { WebSocketService } from 'app/services';

const newOption = 'NEW' as const;

@Component({
  templateUrl: './sftp-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SftpProviderFormComponent extends BaseProviderFormComponent implements OnInit {
  form = this.formBuilder.group({
    host: ['', Validators.required],
    port: [null as number],
    user: ['', Validators.required],
    pass: [''],
    private_key: [null as number | typeof newOption],
  });

  privateKeys$: Observable<Option[]>;

  beforeSubmit(): Observable<unknown> {
    if (this.form.value.private_key !== newOption) {
      return of(undefined);
    }

    return this.makeNewKeypair();
  }

  readonly helptext = helptext;

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private translate: TranslateService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadPrivateKeys();
  }

  private loadPrivateKeys(): void {
    this.privateKeys$ = this.ws.call('keychaincredential.query', [[['type', '=', KeychainCredentialType.SshKeyPair]]])
      .pipe(
        idNameArrayToOptions(),
        map((options) => {
          return [
            {
              label: this.translate.instant('Generate New'),
              value: newOption,
            },
            ...options,
          ];
        }),
      );
  }

  private makeNewKeypair(): Observable<unknown> {
    return this.ws.call('keychaincredential.generate_ssh_key_pair').pipe(
      switchMap((keypair) => {
        const createCredential = {
          name: this.translate.instant('{key} Key', {
            key: this.form.value.host,
          }),
          type: KeychainCredentialType.SshKeyPair,
          attributes: keypair,
        };

        return this.ws.call('keychaincredential.create', [createCredential]).pipe(
          tap((createdKey) => {
            this.loadPrivateKeys();
            this.form.patchValue({
              private_key: createdKey.id,
            });
          }),
        );
      }),
    );
  }
}
