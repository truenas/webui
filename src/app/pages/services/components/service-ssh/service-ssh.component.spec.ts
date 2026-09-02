import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnCheckboxHarness, TnGroupChipsHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { of, throwError } from 'rxjs';
import { provideTnUserDirectory } from 'app/core/providers/tn-user-directory.provider';
import { failApiCall, mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SshSftpLogFacility, SshSftpLogLevel, SshWeakCipher } from 'app/enums/ssh.enum';
import { Group } from 'app/interfaces/group.interface';
import { SshConfig } from 'app/interfaces/ssh-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceSshComponent } from 'app/pages/services/components/service-ssh/service-ssh.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
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
  const getPasswordLoginGroups = (): Promise<TnGroupChipsHarness> => loader.getHarness(
    TnGroupChipsHarness.with({ selector: '[formControlName="password_login_groups"]' }),
  );
  const hasInput = async (name: string): Promise<boolean> => (await loader.getAllHarnesses(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  )).length > 0;
  const hasSelect = async (name: string): Promise<boolean> => (await loader.getAllHarnesses(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  )).length > 0;
  // The Advanced/Basic toggle is rendered by the side-panel host from `footerActions`.
  const toggleAdvancedSettings = (): void => {
    const [toggleAdvanced] = spectator.component.footerActions;
    toggleAdvanced.onClick();
    spectator.detectChanges();
  };

  const createComponent = createRoutingFactory({
    component: ServiceSshComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      provideTnUserDirectory(),
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

  it('blocks Save when the initial config load fails', () => {
    expect(spectator.component.canSubmit()).toBe(true);

    const showErrorModal = jest.spyOn(spectator.inject(ErrorHandlerService), 'showErrorModal')
      .mockReturnValue(of(true));
    failApiCall(api, 'ssh.config');

    // A fresh instance rather than a second `ngOnInit()` on the one from `beforeEach`:
    // re-initialising an already-initialised form re-registers its valueChanges subscriptions,
    // so the assertion would hinge on double-init being harmless.
    const failed = TestBed.createComponent(ServiceSshComponent);
    failed.detectChanges();

    expect(showErrorModal).toHaveBeenCalled();
    // `hasLoadFailed` is what the panel reads (for its banner) and what `<ix-form>`'s
    // extraDisabled is bound to; that binding blocking Save is covered in the ix-form spec.
    expect(failed.componentInstance.hasLoadFailed()).toBe(true);
    expect(failed.componentInstance.canSubmit()).toBe(false);
  });

  it('loads and shows current settings for SSH service when form is opened', async () => {
    expect(api.call).toHaveBeenCalledWith('ssh.config');

    expect(await (await getInput('tcpport')).getValue()).toBe('22');
    expect(await (await getCheckbox('passwordauth')).isChecked()).toBe(true);
    expect(await (await getCheckbox('kerberosauth')).isChecked()).toBe(false);
    expect(await (await getCheckbox('tcpfwd')).isChecked()).toBe(false);
  });

  it('shows the configured password login groups as chips and submits an added one', async () => {
    const groups = await getPasswordLoginGroups();
    expect(await groups.getChips()).toEqual(['dummy-group']);

    await groups.addChip('another-group');

    spectator.component.submit();

    expect(api.call).toHaveBeenCalledWith('ssh.update', [
      expect.objectContaining({ password_login_groups: ['dummy-group', 'another-group'] }),
    ]);
  });

  // The existence check now lives in `tn-group-chips`, which reaches the system through
  // TrueNasUserDirectory. It needs a case where it actually fails: the suite-wide
  // `getGroupByNameCached` mock answers `of(null)` for an unknown group, which the directory
  // reads as "exists", so every other test would pass with the validation not wired at all.
  it('blocks Save while a typed group does not exist on the system', async () => {
    // `Once`, so the erroring lookup cannot leak into the submit tests below: the field
    // makes exactly one call per group, and this control holds exactly one.
    const lookup = jest.spyOn(spectator.inject(UserService), 'getGroupByNameCached')
      .mockImplementationOnce(() => throwError(() => new Error('Group not found')));

    const groups = spectator.component.form.controls.password_login_groups;
    groups.setValue(['ghost-group']);

    // The field debounces before it asks, so the verdict lands a tick later.
    await new Promise((resolve) => {
      setTimeout(resolve, 400);
    });
    spectator.detectChanges();

    expect(lookup).toHaveBeenCalledWith('ghost-group');
    expect(groups.hasError('groupsDoNotExist')).toBe(true);
    expect(spectator.component.canSubmit()).toBe(false);
  });

  it('suggests groups from the directory-services cache as the user types', async () => {
    const groups = await getPasswordLoginGroups();
    await groups.removeChip('dummy-group');
    await groups.typeText('dummy');

    expect(await groups.getSuggestions()).toEqual(['dummy-group']);
    // The directory passes the full query shape: (search, hideBuiltIn, offset, extraFilters).
    expect(spectator.inject(UserService).groupQueryDsCache).toHaveBeenCalledWith('dummy', false, 0, []);
  });

  it('exposes a single footer action that flips between Advanced and Basic Settings', () => {
    expect(spectator.component.footerActions).toHaveLength(1);

    const [toggleAdvanced] = spectator.component.footerActions;
    expect(toggleAdvanced.label).toBe('Advanced Settings');
    expect(toggleAdvanced.testId).toBe('toggle-advanced-options');

    toggleAdvancedSettings();

    expect(spectator.component.footerActions[0].label).toBe('Basic Settings');
  });

  it('shows advanced settings when advanced mode is toggled', async () => {
    toggleAdvancedSettings();

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
    toggleAdvancedSettings();

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
    toggleAdvancedSettings();

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
