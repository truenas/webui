import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { SshConnectionsSetupMethod } from 'app/enums/ssh-connections-setup-method.enum';
import { KeychainSshCredentials, KeychainSshKeyPair } from 'app/interfaces/keychain-credential.interface';
import { SshConnectionSetup } from 'app/interfaces/ssh-connection-setup.interface';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { KeychainCredentialService } from './keychain-credential.service';

describe('KeychainCredentialService', () => {
  let spectator: SpectatorService<KeychainCredentialService>;
  let service: KeychainCredentialService;

  const sshKeys = [
    { id: 1, name: 'key1' },
    { id: 2, name: 'key2' },
  ] as KeychainSshKeyPair[];

  const sshConnections = [
    { id: 1, name: 'connection1' },
    { id: 2, name: 'connection2' },
  ] as KeychainSshCredentials[];

  const connectionSetup = {
    setup_type: SshConnectionsSetupMethod.Manual,
    connection_name: 'test',
    private_key: { generate_key: false, existing_key_id: 1 },
  } as SshConnectionSetup;

  const newConnection = {
    id: 3,
    name: 'test',
  } as KeychainSshCredentials;

  const createService = createServiceFactory({
    service: KeychainCredentialService,
    providers: [
      mockProvider(TypedApiService, {
        query: jest.fn((_, filters: [string, string, KeychainCredentialType][]) => {
          return of(filters[0][2] === KeychainCredentialType.SshKeyPair ? sshKeys : sshConnections);
        }),
        call: jest.fn(() => of(newConnection)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    service = spectator.service;
  });

  describe('getSshKeys', () => {
    it('should return SSH keys', () => {
      service.getSshKeys().subscribe((keys) => {
        expect(keys).toEqual(sshKeys);
      });

      expect(spectator.inject(TypedApiService).query).toHaveBeenCalledWith('keychaincredential.query', [
        ['type', '=', KeychainCredentialType.SshKeyPair],
      ]);
    });
  });

  describe('getSshConnections', () => {
    it('should return SSH connections', () => {
      service.getSshConnections().subscribe((connections) => {
        expect(connections).toEqual(sshConnections);
      });

      expect(spectator.inject(TypedApiService).query).toHaveBeenCalledWith('keychaincredential.query', [
        ['type', '=', KeychainCredentialType.SshCredentials],
      ]);
    });
  });

  describe('addSshConnection', () => {
    it('should add SSH connection and trigger refetch when generating new key', () => {
      const refetchSpy = jest.spyOn(service.refetchSshKeys, 'next');
      const setupWithNewKey: SshConnectionSetup = {
        ...connectionSetup,
        private_key: { generate_key: true, name: 'test-key' },
      };

      service.addSshConnection(setupWithNewKey).subscribe((connection) => {
        expect(connection).toEqual(newConnection);
      });

      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith(
        'keychaincredential.setup_ssh_connection',
        [setupWithNewKey],
      );
      expect(refetchSpy).toHaveBeenCalled();
    });

    it('should add SSH connection and NOT trigger refetch when using existing key', () => {
      const refetchSpy = jest.spyOn(service.refetchSshKeys, 'next');

      service.addSshConnection(connectionSetup).subscribe((connection) => {
        expect(connection).toEqual(newConnection);
      });

      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith(
        'keychaincredential.setup_ssh_connection',
        [connectionSetup],
      );
      expect(refetchSpy).not.toHaveBeenCalled();
    });
  });
});
