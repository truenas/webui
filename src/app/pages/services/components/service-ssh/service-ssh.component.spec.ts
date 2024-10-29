import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SshSftpLogFacility, SshSftpLogLevel, SshWeakCipher } from 'app/enums/ssh.enum';
import { Group } from 'app/interfaces/group.interface';
import { SshConfig } from 'app/interfaces/ssh-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { ServiceSshComponent } from 'app/pages/services/components/service-ssh/service-ssh.component';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

const fakeGroupDataSource = [{
  id: 1,
  gid: 1000,
  group: 'dummy-group',
  builtin: false,
  smb: true,
  users: [41],
}] as Group[];

describe('ServiceSshComponent', () => {
  let spectator: Spectator<ServiceSshComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createRoutingFactory({
    component: ServiceSshComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('group.query', fakeGroupDataSource),
        mockCall('ssh.config', {
          tcpport: 22,
          password_login_groups: ['dummy-group'],
          passwordauth: true,
          kerberosauth: false,
          tcpfwd: false,
          bindiface: ['enp0s3'],
          compression: true,
          sftp_log_level: SshSftpLogLevel.Error,
          sftp_log_facility: SshSftpLogFacility.User,
          weak_ciphers: [SshWeakCipher.Aes128Cbc],
          options: 'options',
        } as SshConfig),
        mockCall('ssh.bindiface_choices', {
          enp0s3: 'enp0s3',
          macvtap0: 'macvtap0',
        }),
        mockCall('ssh.update'),
      ]),
      mockProvider(SlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService),
      mockProvider(SlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('loads and shows current settings for S3 service when form is opened', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(ws.call).toHaveBeenCalledWith('ssh.config');
    expect(values).toEqual({
      'TCP Port': '22',
      'Password Login Groups': ['dummy-group'],
      'Allow Password Authentication': true,
      'Allow Kerberos Authentication': false,
      'Allow TCP Port Forwarding': false,
    });
  });

  it('shows advanced settings when Advanced Settings button is pressed', async () => {
    const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
    await advancedButton.click();

    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      'TCP Port': '22',
      'Allow Password Authentication': true,
      'Allow Kerberos Authentication': false,
      'Allow TCP Port Forwarding': false,
      'Password Login Groups': ['dummy-group'],
      'Bind Interfaces': ['enp0s3'],
      'Compress Connections': true,
      'SFTP Log Level': 'Error',
      'SFTP Log Facility': 'User',
      'Weak Ciphers': [SshWeakCipher.Aes128Cbc],
      'Auxiliary Parameters': 'options',
    });
  });

  it('sends an update payload to websocket when basic form is filled and saved', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'TCP Port': 23,
      'Allow Password Authentication': false,
      'Password Login Groups': ['dummy-group'],
      'Allow Kerberos Authentication': true,
      'Allow TCP Port Forwarding': true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('ssh.update', [{
      // New basic options
      tcpport: 23,
      password_login_groups: ['dummy-group'],
      passwordauth: false,
      kerberosauth: true,
      tcpfwd: true,

      // Old advanced options
      bindiface: ['enp0s3'],
      compression: true,
      options: 'options',
      sftp_log_facility: SshSftpLogFacility.User,
      sftp_log_level: SshSftpLogLevel.Error,
      weak_ciphers: [SshWeakCipher.Aes128Cbc],
    }]);
  });

  it('sends an update payload to websocket when advanced form is filled and saved', async () => {
    const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
    await advancedButton.click();

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Bind Interfaces': ['enp0s3', 'macvtap0'],
      'Password Login Groups': ['dummy-group'],
      'Compress Connections': false,
      'SFTP Log Level': 'Info',
      'SFTP Log Facility': 'Local 0',
      'Weak Ciphers': ['None'],
      'Auxiliary Parameters': 'new-params',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('ssh.update', [{
      // Old basic options
      kerberosauth: false,
      passwordauth: true,
      password_login_groups: ['dummy-group'],
      tcpfwd: false,
      tcpport: 22,

      // New advanced options
      bindiface: ['enp0s3', 'macvtap0'],
      compression: false,
      sftp_log_level: SshSftpLogLevel.Info,
      sftp_log_facility: SshSftpLogFacility.Local0,
      weak_ciphers: [SshWeakCipher.None],
      options: 'new-params',
    }]);
  });
});
