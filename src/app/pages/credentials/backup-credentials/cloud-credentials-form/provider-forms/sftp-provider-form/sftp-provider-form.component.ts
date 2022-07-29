import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { idNameArrayToOptions } from 'app/helpers/options.helper';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import { CloudsyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import {
  BaseProviderFormComponent
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';
import { WebSocketService } from 'app/services';

@Component({
  templateUrl: './sftp-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SftpProviderFormComponent extends BaseProviderFormComponent {
  form = this.formBuilder.group({
    host: ['', Validators.required],
    port: [null as number],
    user: ['', Validators.required],
    pass: ['', Validators.required],
    private_key: [null as number],
  });

  privateKeys$ = this.ws.call('keychaincredential.query', [[['type', '=', KeychainCredentialType.SshKeyPair]]])
    .pipe(
      idNameArrayToOptions(),
    );

  // TODO: Add support for NEW

  readonly helptext = helptext;

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
  ) {
    super();
  }
}
