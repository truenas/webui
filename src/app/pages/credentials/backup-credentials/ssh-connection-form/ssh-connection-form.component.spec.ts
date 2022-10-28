import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { CipherType } from 'app/enums/cipher-type.enum';
import { SshConnectionsSetupMethod } from 'app/enums/ssh-connections-setup-method.enum';
import { KeychainSshCredentials } from 'app/interfaces/keychain-credential.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { KeychainCredentialService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { SshConnectionFormComponent } from './ssh-connection-form.component';

describe('SshConnectionFormComponent', () => {
  let spectator: Spectator<SshConnectionFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const existingConnection = {
    id: 11,
    name: 'auto',
    attributes: {
      host: '127.0.0.1',
      port: 22,
      username: 'root',
      private_key: 1,
      remote_host_key: 'ssh-rsaAAAAB3NzaC1',
      cipher: CipherType.Standard,
      connect_timeout: 10,
    },
  } as KeychainSshCredentials;

  const createComponent = createComponentFactory({
    component: SshConnectionFormComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
      AppLoaderModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('keychaincredential.remote_ssh_host_key_scan', 'ssh-rsaAREMOTE'),
        mockCall('keychaincredential.setup_ssh_connection'),
        mockCall('keychaincredential.update'),
      ]),
      mockProvider(KeychainCredentialService, {
        getSshKeys: () => of([
          { id: 1, name: 'key1' },
          { id: 2, name: 'key2' },
        ]),
      }),
      mockProvider(IxSlideInService),
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: { dialog: false },
      },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('shows values for an existing SSH connection', async () => {
    spectator.component.setConnectionForEdit(existingConnection);

    const values = await form.getValues();
    expect(values).toEqual({
      Name: 'auto',

      Host: '127.0.0.1',
      Port: '22',
      Username: 'root',
      'Private Key': 'key1',
      'Remote Host Key': 'ssh-rsaAAAAB3NzaC1',

      Cipher: 'Standard',
      'Connect Timeout': '10',
    });
  });

  it('saves an updated SSH connection when edit form is submitted', async () => {
    spectator.component.setConnectionForEdit(existingConnection);

    await form.fillForm({
      Name: 'Updated',
      'Remote Host Key': 'ssh-rsaAAAAUpdated',
      Cipher: 'Fast',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('keychaincredential.update', [11, {
      name: 'Updated',
      attributes: {
        cipher: CipherType.Fast,
        connect_timeout: 10,
        host: '127.0.0.1',
        port: 22,
        private_key: 1,
        remote_host_key: 'ssh-rsaAAAAUpdated',
        username: 'root',
      },
    }]);
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });

  it('saves new SSH connection added manually', async () => {
    await form.fillForm({
      Name: 'New',
      'Setup Method': 'Manual',
    });
    await form.fillForm({
      Host: 'truenas.com',
      Port: 23,
      Username: 'john',
      'Private Key': 'key2',
      'Remote Host Key': 'ssh-rsaNew',

      Cipher: 'Disabled',
      'Connect Timeout': '20',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('keychaincredential.setup_ssh_connection', [{
      setup_type: SshConnectionsSetupMethod.Manual,
      connection_name: 'New',
      private_key: {
        generate_key: false,
        existing_key_id: 2,
      },
      manual_setup: {
        cipher: CipherType.Disabled,
        connect_timeout: '20',
        host: 'truenas.com',
        port: 23,
        remote_host_key: 'ssh-rsaNew',
        username: 'john',
      },
    }]);
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });

  it('saves new SSH connection added using semi-automatic setup', async () => {
    await form.fillForm({
      Name: 'Update',
      'Setup Method': 'Semi-automatic (TrueNAS only)',

      'TrueNAS URL': 'https://truenas.com',
      Username: 'john',
      Password: '12345678',
      'One-Time Password (if necessary)': '1234',
      'Private Key': 'key2',

      Cipher: 'Fast',
    });
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('keychaincredential.setup_ssh_connection', [{
      connection_name: 'Update',
      setup_type: SshConnectionsSetupMethod.SemiAutomatic,
      private_key: {
        existing_key_id: 2,
        generate_key: false,
      },
      semi_automatic_setup: {
        cipher: CipherType.Fast,
        connect_timeout: 10,
        password: '12345678',
        otp_token: '1234',
        url: 'https://truenas.com',
        username: 'john',
      },
    }]);
  });

  it('gets remote host key and puts it in corresponding textarea when Discover Remote Host Key is pressed', async () => {
    await form.fillForm({
      'Setup Method': 'Manual',
    });
    await form.fillForm({
      Port: '24',
      Host: 'remote.com',
      Username: 'john',
      'Private Key': 'Generate New',
      'Connect Timeout': '30',
    });

    const discoverButton = await loader.getHarness(MatButtonHarness.with({ text: 'Discover Remote Host Key' }));
    await discoverButton.click();

    const values = await form.getValues();
    expect(values['Remote Host Key']).toBe('ssh-rsaAREMOTE');
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('keychaincredential.remote_ssh_host_key_scan', [{
      connect_timeout: '30',
      host: 'remote.com',
      port: 24,
    }]);
  });

  it('allows new primary key to be generated when creating a new connection', async () => {
    await form.fillForm({
      Name: 'Test',
      'TrueNAS URL': 'https://truenas.com',
      Password: '123456',
      'Private Key': 'Generate New',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('keychaincredential.setup_ssh_connection', [{
      connection_name: 'Test',
      setup_type: SshConnectionsSetupMethod.SemiAutomatic,
      private_key: {
        generate_key: true,
        name: 'Test Key',
      },
      semi_automatic_setup: {
        cipher: CipherType.Standard,
        connect_timeout: 10,
        otp_token: '',
        password: '123456',
        url: 'https://truenas.com',
        username: 'root',
      },
    }]);
  });
});
