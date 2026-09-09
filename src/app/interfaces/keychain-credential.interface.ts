import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { SshCredentials } from 'app/interfaces/ssh-credentials.interface';

export type KeychainCredential
  = | KeychainSshKeyPair
    | KeychainSshCredentials;

/**
 * `type` is the wire literal rather than the enum member: the enum is still
 * what code writes and compares against, but values read from the typed API
 * arrive as literals, and a literal is not assignable to an enum.
 */
export interface KeychainSshKeyPair {
  attributes: SshKeyPair;
  id: number;
  name: string;
  type: `${KeychainCredentialType.SshKeyPair}`;
}

/** Either key may be absent: middleware derives the public key from the private one. */
export interface SshKeyPair {
  private_key?: string | null;
  public_key?: string | null;
}

export interface KeychainSshCredentials {
  attributes: SshCredentials;
  id: number;
  name: string;
  type: `${KeychainCredentialType.SshCredentials}`;
}

export type KeychainCredentialCreate
  = | Omit<KeychainSshKeyPair, 'id'>
    | Omit<KeychainSshCredentials, 'id'>;

export type KeychainCredentialUpdate
  = | Omit<KeychainSshKeyPair, 'id' | 'type'>
    | Omit<KeychainSshCredentials, 'id' | 'type'>;

export interface KeychainCredentialDeleteOptions {
  cascade?: boolean;
}

export interface KeychainCredentialUsedBy {
  title: string;
  unbind_method: string;
}
