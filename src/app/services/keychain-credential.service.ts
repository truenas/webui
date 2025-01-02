import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { KeychainSshCredentials, KeychainSshKeyPair } from 'app/interfaces/keychain-credential.interface';
import { ApiService } from 'app/modules/websocket/api.service';

@Injectable({
  providedIn: 'root',
})
export class KeychainCredentialService {
  constructor(protected api: ApiService) { }

  getSshKeys(): Observable<KeychainSshKeyPair[]> {
    return this.api.call('keychaincredential.query', [[['type', '=', KeychainCredentialType.SshKeyPair]]]) as Observable<KeychainSshKeyPair[]>;
  }

  getSshConnections(): Observable<KeychainSshCredentials[]> {
    return this.api.call('keychaincredential.query', [[['type', '=', KeychainCredentialType.SshCredentials]]]) as Observable<KeychainSshCredentials[]>;
  }
}
