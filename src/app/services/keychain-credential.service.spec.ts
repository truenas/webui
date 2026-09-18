import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { SshConnectionsSetupMethod } from 'app/enums/ssh-connections-setup-method.enum';
import {
  KeychainCredentialUsedBy, KeychainSshCredentials, KeychainSshKeyPair,
} from 'app/interfaces/keychain-credential.interface';
import { SshConnectionSetup } from 'app/interfaces/ssh-connection-setup.interface';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { KeychainCredentialService } from 'app/services/keychain-credential.service';

describe('KeychainCredentialService', () => {
  let spectator: SpectatorService<KeychainCredentialService>;
  let service: KeychainCredentialService;

  const sshKeys = [
    { id: 1, name: 'key1', type: KeychainCredentialType.SshKeyPair },
    { id: 2, name: 'key2', type: KeychainCredentialType.SshKeyPair },
  ] as KeychainSshKeyPair[];

  const sshConnections = [
    { id: 1, name: 'connection1', type: KeychainCredentialType.SshCredentials },
    { id: 2, name: 'connection2', type: KeychainCredentialType.SshCredentials },
  ] as KeychainSshCredentials[];

  const connectionSetup = {
    setup_type: SshConnectionsSetupMethod.Manual,
    connection_name: 'test',
    private_key: { generate_key: false, existing_key_id: 1 },
  } as SshConnectionSetup;

  const newConnection = {
    id: 3,
    name: 'test',
    type: KeychainCredentialType.SshCredentials,
  } as KeychainSshCredentials;

  const usedBy = [
    { title: 'Replication task', unbind_method: 'disable' },
  ] as KeychainCredentialUsedBy[];

  const createService = createServiceFactory({
    service: KeychainCredentialService,
    providers: [
      mockTypedApi([
        mockTypedCall('keychaincredential.used_by', usedBy),
        mockTypedCall('keychaincredential.setup_ssh_connection', newConnection),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    service = spectator.service;
  });

  describe('getSshKeys', () => {
    it('queries key pairs', async () => {
      spectator.inject(MockTypedApiService).mockQuery('keychaincredential.query', sshKeys);

      expect(await firstValueFrom(service.getSshKeys())).toEqual(sshKeys);
      expect(spectator.inject(TypedApiService).query).toHaveBeenCalledWith('keychaincredential.query', [
        ['type', '=', KeychainCredentialType.SshKeyPair],
      ]);
    });
  });

  describe('getSshConnections', () => {
    it('queries SSH connections', async () => {
      spectator.inject(MockTypedApiService).mockQuery('keychaincredential.query', sshConnections);

      expect(await firstValueFrom(service.getSshConnections())).toEqual(sshConnections);
      expect(spectator.inject(TypedApiService).query).toHaveBeenCalledWith('keychaincredential.query', [
        ['type', '=', KeychainCredentialType.SshCredentials],
      ]);
    });
  });

  describe('getUsedBy', () => {
    it('asks what depends on the credential', async () => {
      expect(await firstValueFrom(service.getUsedBy(2))).toEqual(usedBy);
      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('keychaincredential.used_by', [2]);
    });
  });

  describe('addSshConnection', () => {
    it('adds an SSH connection and triggers a key refetch when generating a new key', async () => {
      const refetchSpy = jest.spyOn(service.refetchSshKeys, 'next');
      const setupWithNewKey: SshConnectionSetup = {
        ...connectionSetup,
        private_key: { generate_key: true, name: 'test-key' },
      };

      expect(await firstValueFrom(service.addSshConnection(setupWithNewKey))).toEqual(newConnection);
      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith(
        'keychaincredential.setup_ssh_connection',
        [setupWithNewKey],
      );
      expect(refetchSpy).toHaveBeenCalled();
    });

    it('adds an SSH connection without a refetch when using an existing key', async () => {
      const refetchSpy = jest.spyOn(service.refetchSshKeys, 'next');

      expect(await firstValueFrom(service.addSshConnection(connectionSetup))).toEqual(newConnection);
      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith(
        'keychaincredential.setup_ssh_connection',
        [connectionSetup],
      );
      expect(refetchSpy).not.toHaveBeenCalled();
    });
  });
});
