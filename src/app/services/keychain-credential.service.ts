import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, map } from 'rxjs';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { KeychainSshCredentials, KeychainSshKeyPair } from 'app/interfaces/keychain-credential.interface';
import { Option } from 'app/interfaces/option.interface';
import { SshCredentialsNewOption } from 'app/pages/data-protection/replication/replication-wizard/replication-wizard-data.interface';
import { WebSocketService } from 'app/services/ws.service';

@Injectable({
  providedIn: 'root',
})
export class KeychainCredentialService {
  constructor(protected ws: WebSocketService, private translate: TranslateService) { }

  getSshKeys(): Observable<KeychainSshKeyPair[]> {
    return this.ws.call('keychaincredential.query', [[['type', '=', KeychainCredentialType.SshKeyPair]]]) as Observable<KeychainSshKeyPair[]>;
  }

  getSshConnections(): Observable<KeychainSshCredentials[]> {
    return this.ws.call('keychaincredential.query', [[['type', '=', KeychainCredentialType.SshCredentials]]]) as Observable<KeychainSshCredentials[]>;
  }

  getSshCredentialsOptions(): Observable<Option[]> {
    return this.getSshConnections().pipe(
      idNameArrayToOptions(),
      map((options) => {
        return [
          { label: this.translate.instant('Create New'), value: SshCredentialsNewOption.New },
          ...options,
        ];
      }),
    );
  }
}
