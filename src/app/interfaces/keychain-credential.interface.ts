import { CallParams, v27_0_0 } from '@truenas/api-client';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { SshCredentials } from 'app/interfaces/ssh-credentials.interface';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

type D = WebUiApiDirectory;

/**
 * A keychain credential, discriminated on `type`.
 *
 * Middleware's entry model (`v27_0_0.KeychainCredentialEntry`) types
 * `attributes` as the union of both kinds without tying it to `type`, so the
 * UI keeps the discrimination and takes each half's shape from the client.
 *
 * `KeychainCredentialType` is still the UI's value holder: the client's
 * const objects are not reachable as values through its namespaces yet.
 */
export type KeychainCredential = KeychainSshKeyPair | KeychainSshCredentials;

type KeychainCredentialBase = Omit<v27_0_0.KeychainCredentialEntry, 'type' | 'attributes'>;

export interface KeychainSshKeyPair extends KeychainCredentialBase {
  type: `${KeychainCredentialType.SshKeyPair}`;
  attributes: SshKeyPair;
}

export interface KeychainSshCredentials extends KeychainCredentialBase {
  type: `${KeychainCredentialType.SshCredentials}`;
  attributes: SshCredentials;
}

/** Either key may be absent: middleware derives the public key from the private one. */
export type SshKeyPair = v27_0_0.SSHKeyPair;

export type KeychainCredentialCreate = CallParams<D, 'keychaincredential.create'>[0];

export type KeychainCredentialUpdate = CallParams<D, 'keychaincredential.update'>[1];

export type KeychainCredentialDeleteOptions = v27_0_0.KeychainCredentialDeleteOptions;

export type KeychainCredentialUsedBy = v27_0_0.UsedKeychainCredential;
