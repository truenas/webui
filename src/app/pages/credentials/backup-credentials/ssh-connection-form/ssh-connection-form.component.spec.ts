import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness, TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SshConnectionsSetupMethod } from 'app/enums/ssh-connections-setup-method.enum';
import { KeychainSshCredentials } from 'app/interfaces/keychain-credential.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { KeychainCredentialService } from 'app/services/keychain-credential.service';
import { SshConnectionFormComponent } from './ssh-connection-form.component';

describe('SshConnectionFormComponent', () => {
  let spectator: Spectator<SshConnectionFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const existingConnection = {
    id: 11,
    name: 'auto',
    attributes: {
      host: '127.0.0.1',
      port: 22,
      username: 'root',
      private_key: 1,
      remote_host_key: 'ssh-rsaAAAAB3NzaC1',
      connect_timeout: 10,
    },
  } as KeychainSshCredentials;

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  const createComponent = createComponentFactory({
    component: SshConnectionFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('keychaincredential.remote_ssh_host_key_scan', 'ssh-rsaAREMOTE'),
        mockCall('keychaincredential.setup_ssh_connection', existingConnection),
        mockCall('keychaincredential.update', existingConnection),
      ]),
      mockProvider(KeychainCredentialService, {
        getSshKeys: () => of([
          { id: 1, name: 'key1' },
          { id: 2, name: 'key2' },
        ]),
        addSshConnection: jest.fn(() => of(existingConnection)),
      }),
      mockProvider(DialogService),
      mockProvider(DialogRef),
      mockAuth(),
    ],
  });

  describe('Edit existing SSH', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: { editConnection: existingConnection },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('shows values for an existing SSH connection', async () => {
      expect(await (await getInput('connection_name')).getValue()).toBe('auto');
      expect(await (await getInput('host')).getValue()).toBe('127.0.0.1');
      expect(await (await getInput('port')).getValue()).toBe('22');
      expect(await (await getInput('username')).getValue()).toBe('root');
      expect(await (await getInput('remote_host_key')).getValue()).toBe('ssh-rsaAAAAB3NzaC1');
      expect(await (await getInput('connect_timeout')).getValue()).toBe('10');
      expect(await (await getSelect('private_key')).getDisplayText()).toBe('key1');
    });

    it('saves an updated SSH connection when edit form is submitted', async () => {
      const closedSpy = jest.spyOn(spectator.component.closed, 'emit');

      await (await getInput('connection_name')).setValue('Updated');
      await (await getInput('remote_host_key')).setValue('ssh-rsaAAAAUpdated');

      spectator.component.submit();

      expect(api.call).toHaveBeenCalledWith('keychaincredential.update', [11, {
        name: 'Updated',
        attributes: {
          connect_timeout: 10,
          host: '127.0.0.1',
          port: 22,
          private_key: 1,
          remote_host_key: 'ssh-rsaAAAAUpdated',
          username: 'root',
        },
      }]);
      expect(closedSpy).toHaveBeenCalledWith(existingConnection);
    });
  });

  describe('Add new SSH', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('saves new SSH connection added manually', async () => {
      const closedSpy = jest.spyOn(spectator.component.closed, 'emit');

      await (await getSelect('setup_method')).selectOption('Manual');
      await (await getInput('connection_name')).setValue('New');
      await (await getInput('host')).setValue('truenas.com');
      await (await getInput('port')).setValue('23');
      await (await getInput('username')).setValue('john');
      await (await getSelect('private_key')).selectOption('key2');
      await (await getInput('remote_host_key')).setValue('ssh-rsaNew');
      await (await getInput('connect_timeout')).setValue('20');

      spectator.component.submit();

      expect(spectator.inject(KeychainCredentialService).addSshConnection).toHaveBeenCalledWith({
        setup_type: SshConnectionsSetupMethod.Manual,
        connection_name: 'New',
        private_key: {
          generate_key: false,
          existing_key_id: 2,
        },
        manual_setup: {
          connect_timeout: 20,
          host: 'truenas.com',
          port: 23,
          remote_host_key: 'ssh-rsaNew',
          username: 'john',
        },
      });
      expect(closedSpy).toHaveBeenCalledWith(existingConnection);
    });

    it('saves new SSH connection added using semi-automatic setup', async () => {
      await (await getSelect('setup_method')).selectOption('Semi-automatic (TrueNAS only)');
      await (await getInput('connection_name')).setValue('Update');
      await (await getInput('url')).setValue('10.11.12.13');
      await (await getInput('username')).setValue('john');
      await (await getInput('admin_username')).setValue('admin');
      await (await getInput('password')).setValue('12345678');
      await (await getInput('otp_token')).setValue('1234');
      await (await getSelect('private_key')).selectOption('key2');
      await (await getCheckbox('sudo')).check();

      spectator.component.submit();

      expect(spectator.inject(KeychainCredentialService).addSshConnection).toHaveBeenCalledWith({
        connection_name: 'Update',
        setup_type: SshConnectionsSetupMethod.SemiAutomatic,
        private_key: {
          existing_key_id: 2,
          generate_key: false,
        },
        semi_automatic_setup: {
          connect_timeout: 10,
          password: '12345678',
          otp_token: '1234',
          url: 'http://10.11.12.13',
          username: 'john',
          admin_username: 'admin',
          sudo: true,
        },
      });
    });

    it('gets remote host key and puts it in corresponding textarea when Discover Remote Host Key is pressed', async () => {
      await (await getSelect('setup_method')).selectOption('Manual');
      await (await getInput('port')).setValue('24');
      await (await getInput('host')).setValue('remote.com');
      await (await getInput('username')).setValue('john');
      await (await getSelect('private_key')).selectOption('Generate New');
      await (await getInput('connect_timeout')).setValue('30');

      const discoverButton = await loader.getHarness(TnButtonHarness.with({ label: 'Discover Remote Host Key' }));
      await discoverButton.click();

      expect(await (await getInput('remote_host_key')).getValue()).toBe('ssh-rsaAREMOTE');
      expect(api.call).toHaveBeenCalledWith('keychaincredential.remote_ssh_host_key_scan', [{
        connect_timeout: 30,
        host: 'remote.com',
        port: 24,
      }]);
    });

    it('allows new primary key to be generated when creating a new connection', async () => {
      await (await getInput('connection_name')).setValue('Test');
      await (await getInput('url')).setValue('truenas.com');
      await (await getInput('password')).setValue('123456');
      await (await getSelect('private_key')).selectOption('Generate New');

      spectator.component.submit();

      expect(spectator.inject(KeychainCredentialService).addSshConnection).toHaveBeenCalledWith({
        connection_name: 'Test',
        setup_type: SshConnectionsSetupMethod.SemiAutomatic,
        private_key: {
          generate_key: true,
          name: 'Test Key',
        },
        semi_automatic_setup: {
          connect_timeout: 10,
          otp_token: '',
          password: '123456',
          url: 'http://truenas.com',
          username: 'root',
          admin_username: 'root',
          sudo: false,
        },
      });
    });
  });
});
