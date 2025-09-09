import { Injectable, inject } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { KeychainSshCredentials, KeychainSshKeyPair } from 'app/interfaces/keychain-credential.interface';
import { SshConnectionSetup } from 'app/interfaces/ssh-connection-setup.interface';
import { ApiService } from 'app/modules/websocket/api.service';

@Injectable({
  providedIn: 'root',
})
export class KeychainCredentialService {
  protected api = inject(ApiService);
  refetchSshKeys = new Subject<void>();


  getSshKeys(): Observable<KeychainSshKeyPair[]> {
    return this.api.call('keychaincredential.query', [[['type', '=', KeychainCredentialType.SshKeyPair]]]) as Observable<KeychainSshKeyPair[]>;
  }

  getSshConnections(): Observable<KeychainSshCredentials[]> {
    return this.api.call('keychaincredential.query', [[['type', '=', KeychainCredentialType.SshCredentials]]]) as Observable<KeychainSshCredentials[]>;
  }

  addSshConnection(connection: SshConnectionSetup): Observable<KeychainSshCredentials> {
    return this.api.call('keychaincredential.setup_ssh_connection', [connection])
      .pipe(tap(() => {
      // Only refetch if a new key was generated
        const willGenerateNewKey = connection.private_key?.generate_key === true;
        if (willGenerateNewKey) {
          this.refetchSshKeys.next();
        }
      }));
  }
}
