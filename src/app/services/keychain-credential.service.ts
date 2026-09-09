import { Injectable, inject } from '@angular/core';
import {
  map, Observable, Subject, tap,
} from 'rxjs';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import {
  KeychainCredentialUsedBy, KeychainSshCredentials, KeychainSshKeyPair,
} from 'app/interfaces/keychain-credential.interface';
import { SshConnectionSetup } from 'app/interfaces/ssh-connection-setup.interface';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';

@Injectable({
  providedIn: 'root',
})
export class KeychainCredentialService {
  protected api = inject(TypedApiService);
  refetchSshKeys = new Subject<void>();
  refetchSshConnections = new Subject<void>();

  getSshKeys(): Observable<KeychainSshKeyPair[]> {
    return this.api.query('keychaincredential.query', [['type', '=', KeychainCredentialType.SshKeyPair]]).pipe(
      // The filter guarantees the variant; the generated entity is the union.
      map((credentials) => credentials as KeychainSshKeyPair[]),
    );
  }

  getSshConnections(): Observable<KeychainSshCredentials[]> {
    return this.api.query('keychaincredential.query', [['type', '=', KeychainCredentialType.SshCredentials]]).pipe(
      map((credentials) => credentials as KeychainSshCredentials[]),
    );
  }

  /** Everything that depends on a credential, so a delete can warn or cascade. */
  getUsedBy(credentialId: number): Observable<KeychainCredentialUsedBy[]> {
    return this.api.call('keychaincredential.used_by', [credentialId]).pipe(
      // The generated type is missing `title`, which middleware does declare
      // and send: the client's generator strips every nested `title` key from
      // the schema, a real property of that name included. Until that is
      // fixed upstream the UI's own interface describes the wire correctly.
      map((usedBy) => usedBy as KeychainCredentialUsedBy[]),
    );
  }

  addSshConnection(connection: SshConnectionSetup): Observable<KeychainSshCredentials> {
    return this.api.call('keychaincredential.setup_ssh_connection', [connection])
      .pipe(
        map((credentials) => credentials as KeychainSshCredentials),
        tap(() => {
          // Only refetch if a new key was generated
          const willGenerateNewKey = connection.private_key?.generate_key === true;
          if (willGenerateNewKey) {
            this.refetchSshKeys.next();
          }
        }),
      );
  }
}
