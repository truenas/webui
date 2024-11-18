import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { KeychainSshCredentials, KeychainSshKeyPair } from 'app/interfaces/keychain-credential.interface';
import { ApiService } from 'app/services/websocket/api.service';

@Injectable({
  providedIn: 'root',
})
export class KeychainCredentialService {
  constructor(protected ws: ApiService) { }

  getSshKeys(): Observable<KeychainSshKeyPair[]> {
    return this.ws.call('keychaincredential.query', [[['type', '=', KeychainCredentialType.SshKeyPair]]]) as Observable<KeychainSshKeyPair[]>;
  }

  getSshConnections(): Observable<KeychainSshCredentials[]> {
    return this.ws.call('keychaincredential.query', [[['type', '=', KeychainCredentialType.SshCredentials]]]) as Observable<KeychainSshCredentials[]>;
  }
}
