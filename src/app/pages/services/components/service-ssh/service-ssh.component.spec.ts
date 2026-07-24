import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnCheckboxHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SshSftpLogFacility, SshSftpLogLevel, SshWeakCipher } from 'app/enums/ssh.enum';
import { Group } from 'app/interfaces/group.interface';
import { SshConfig } from 'app/interfaces/ssh-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ixFormMinSubmitFeedbackMs } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceSshComponent } from 'app/pages/services/components/service-ssh/service-ssh.component';
import { UserService } from 'app/services/user.service';

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
  let api: ApiService;

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const hasInput = async (name: string): Promise<boolean> => (await loader.getAllHarnesses(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  )).length > 0;
  const hasSelect = async (name: string): Promise<boolean> => (await loader.getAllHarnesses(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  )).length > 0;

  const createComponent = createRoutingFactory({
    component: ServiceSshComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
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
      ...ixFormTestingProviders(),
      { provide: ixFormMinSubmitFeedbackMs, useValue: 0 },
      mockProvider(DialogService),
      mockProvider(UserService, {
        groupQueryDsCache: jest.fn(() => of(fakeGroupDataSource)),
        getGroupByName: jest.fn((groupName: string) => {
          const existingGroup = fakeGroupDataSource.find((group) => group.group === groupName);
          if (existingGroup) {
            return of(existingGroup);
          }
          return of(null);
        }),
        getGroupByNameCached: jest.fn((groupName: string) => {
          const existingGroup = fakeGroupDataSource.find((group) => group.group === groupName);
          if (existingGroup) {
            return of(existingGroup);
          }
          return of(null);
        }),
        getUserByName: jest.fn(() => of(null)),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('loads and shows current settings for SSH service when form is opened', async () => {
    expect(api.call).toHaveBeenCalledWith('ssh.config');

    expect(await (await getInput('tcpport')).getValue()).toBe('22');
    expect(await (await getCheckbox('passwordauth')).isChecked()).toBe(true);
    expect(await (await getCheckbox('kerberosauth')).isChecked()).toBe(false);
    expect(await (await getCheckbox('tcpfwd')).isChecked()).toBe(false);
  });

  it('shows advanced settings when Advanced Settings button is pressed', async () => {
    spectator.component.onAdvancedSettingsToggled();
    spectator.detectChanges();

    expect(await (await getInput('tcpport')).getValue()).toBe('22');
    expect(await (await getCheckbox('passwordauth')).isChecked()).toBe(true);
    expect(await (await getCheckbox('kerberosauth')).isChecked()).toBe(false);
    expect(await (await getCheckbox('tcpfwd')).isChecked()).toBe(false);

    expect(await (await getSelect('bindiface')).getDisplayText()).toBe('enp0s3');
    expect(await (await getCheckbox('compression')).isChecked()).toBe(true);
    expect(await (await getSelect('sftp_log_level')).getDisplayText()).toBe('Error');
    expect(await (await getSelect('sftp_log_facility')).getDisplayText()).toBe('User');
    expect(await (await getSelect('weak_ciphers')).getDisplayText()).toBe('AES128-CBC');
    expect(await (await getInput('options')).getValue()).toBe('options');
  });

  it('sends an update payload to websocket when basic form is filled and saved', async () => {
    await (await getInput('tcpport')).setValue('23');
    await (await getCheckbox('passwordauth')).uncheck();
    await (await getCheckbox('kerberosauth')).check();
    await (await getCheckbox('tcpfwd')).check();

    spectator.component.submit();

    expect(api.call).toHaveBeenCalledWith('ssh.update', [{
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
    spectator.component.onAdvancedSettingsToggled();
    spectator.detectChanges();

    await (await getSelect('bindiface')).selectOption('macvtap0');
    await (await getCheckbox('compression')).uncheck();
    await (await getSelect('sftp_log_level')).selectOption('Info');
    await (await getSelect('sftp_log_facility')).selectOption('Local 0');
    await (await getSelect('weak_ciphers')).selectOption('None');
    await (await getSelect('weak_ciphers')).selectOption('AES128-CBC');
    await (await getInput('options')).setValue('new-params');

    spectator.component.submit();

    expect(api.call).toHaveBeenCalledWith('ssh.update', [{
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

  it('submits an empty SFTP log level when the selection is cleared', async () => {
    spectator.component.onAdvancedSettingsToggled();
    spectator.detectChanges();

    await (await getSelect('sftp_log_level')).selectOption('--');

    spectator.component.submit();

    expect(api.call).toHaveBeenCalledWith('ssh.update', [
      expect.objectContaining({ sftp_log_level: '' }),
    ]);
  });

  it('does not show advanced fields while in basic mode', async () => {
    expect(await hasInput('options')).toBe(false);
    expect(await hasSelect('bindiface')).toBe(false);
    expect(await hasSelect('weak_ciphers')).toBe(false);
  });
});
