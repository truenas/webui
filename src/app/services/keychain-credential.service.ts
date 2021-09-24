import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { KeychainCredential, KeychainSshKeyPair } from 'app/interfaces/keychain-credential.interface';
import { WebSocketService } from './ws.service';

@Injectable()
export class KeychainCredentialService {
  constructor(protected ws: WebSocketService) { }

  getSSHKeys(): Observable<KeychainSshKeyPair[]> {
    return this.ws.call('keychaincredential.query', [[['type', '=', KeychainCredentialType.SshKeyPair]]]) as Observable<KeychainSshKeyPair[]>;
  }

  getSSHConnections(): Observable<KeychainCredential[]> {
    return this.ws.call('keychaincredential.query', [[['type', '=', KeychainCredentialType.SshCredentials]]]);
  }
}
