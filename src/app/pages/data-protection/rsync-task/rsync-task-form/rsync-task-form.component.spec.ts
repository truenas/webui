import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnCheckboxHarness, TnChipInputHarness, TnInputHarness, TnSelectHarness, TnSlideToggleHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Direction } from 'app/enums/direction.enum';
import { RsyncMode } from 'app/enums/rsync-mode.enum';
import { KeychainCredential } from 'app/interfaces/keychain-credential.interface';
import { RsyncTask } from 'app/interfaces/rsync-task.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  SshCredentialsSelectComponent,
} from 'app/modules/forms/custom-selects/ssh-credentials-select/ssh-credentials-select.component';
import { IxExplorerHarness } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.harness';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { IxUserComboboxHarness } from 'app/modules/forms/ix-forms/testing/user-group-picker.harnesses';
import { LocaleService } from 'app/modules/language/locale.service';
import { SchedulerHarness } from 'app/modules/scheduler/components/scheduler/scheduler.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { UserService } from 'app/services/user.service';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';
import { RsyncTaskFormComponent } from './rsync-task-form.component';

describe('RsyncTaskFormComponent', () => {
  const existingTask = {
    path: '/mnt/x/oooo',
    user: 'root',
    direction: Direction.Push,
    desc: 'My rsync task',

    mode: RsyncMode.Module,
    remotehost: 'pentagon.gov',
    remotemodule: 'module',

    schedule: {
      minute: '0', hour: '*', dom: '*', month: '*', dow: '*',
    },
    recursive: true,
    enabled: true,

    times: true,
    compress: true,
    archive: false,
    delete: false,
    quiet: true,
    preserveperm: false,
    preserveattr: false,
    delayupdates: true,
    extra: ['param=value'],
  } as RsyncTask;

  let spectator: Spectator<RsyncTaskFormComponent>;
  let closedSpy: jest.SpyInstance;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: RsyncTaskFormComponent,
    imports: [
      ReactiveFormsModule,
      SshCredentialsSelectComponent,
    ],
    providers: [
      mockProvider(LocaleService, {
        timezone: 'America/New_York',
      }),
      mockAuth(),
      mockApi([
        mockCall('rsynctask.create', existingTask),
        mockCall('rsynctask.update', existingTask),
        mockCall('keychaincredential.query', [
          { id: 1, name: 'ssh01' },
          { id: 2, name: 'ssh02' },
        ] as KeychainCredential[]),
      ]),
      mockProvider(FilesystemService),
      mockProvider(UserService, {
        userQueryDsCache: () => of([
          { username: 'root' },
          { username: 'steven' },
        ] as User[]),
        getUserByName: (username: string) => of({ username } as User),
        getUserByNameCached: (username: string) => of({ username } as User),
      }),
      mockProvider(DialogService),
      provideMockStore({
        selectors: [
          {
            selector: selectTimezone,
            value: 'America/New_York',
          },
        ],
      }),
      ...ixFormTestingProviders(),
    ],
  });

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const setCheckbox = async (name: string, value: boolean): Promise<void> => {
    const checkbox = await getCheckbox(name);
    if (value) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  };

  // Panel-hosted form: the `<tn-side-panel>` footer owns Save and calls `submit()`.

  const saveForm = (): void => {
    spectator.component.submit();

    spectator.detectChanges();
  };

  describe('adds a new rsync task', () => {
    beforeEach(() => {
      spectator = createComponent();
      closedSpy = jest.spyOn(spectator.component.closed, 'emit');
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('adds a new rsync task when new form is saved', async () => {
      await (await loader.getHarness(IxExplorerHarness.with({ selector: '[formControlName="path"]' }))).setValue('/mnt/new');
      // `ix-user-combobox` is its own CVA — the control name is on the wrapper,
      // so it is addressed by that rather than by the field label.
      const user = await loader.getHarness(IxUserComboboxHarness.with({ selector: '[formControlName="user"]' }));
      await user.setInputValue('steven');
      await user.blur();
      await (await getSelect('direction')).selectOption('Pull');
      await (await getInput('desc')).setValue('My new task');

      await (await getSelect('mode')).selectOption('Module');
      await (await getInput('remotehost')).setValue('pentagon.gov');
      await (await getInput('remotemodule')).setValue('module');

      await (await loader.getHarness(SchedulerHarness.with({ label: 'Schedule' }))).setValue('0 2 * * *');
      await setCheckbox('recursive', false);
      await setCheckbox('enabled', true);

      await setCheckbox('times', false);
      await setCheckbox('compress', true);
      await setCheckbox('archive', false);
      await setCheckbox('delete', true);
      await setCheckbox('quiet', true);
      await setCheckbox('preserveperm', true);
      await setCheckbox('preserveattr', false);
      await setCheckbox('delayupdates', false);
      await (await loader.getHarness(TnChipInputHarness.with({ selector: '[formControlName="extra"]' }))).addChip('param=newValue');

      saveForm();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('rsynctask.create', [{
        archive: false,
        compress: true,
        delayupdates: false,
        delete: true,
        desc: 'My new task',
        direction: Direction.Pull,
        enabled: true,
        extra: ['param=newValue'],
        mode: RsyncMode.Module,
        path: '/mnt/new',
        preserveattr: false,
        preserveperm: true,
        quiet: true,
        recursive: false,
        remotehost: 'pentagon.gov',
        remotemodule: 'module',
        ssh_credentials: null,
        schedule: {
          dom: '*', dow: '*', hour: '2', minute: '0', month: '*',
        },
        times: false,
        user: 'steven',
      }]);
      expect(closedSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('edits rsync task', () => {
    beforeEach(() => {
      spectator = createComponent({ props: { taskToEdit: { ...existingTask, id: 1 } } });
      closedSpy = jest.spyOn(spectator.component.closed, 'emit');
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows values for an existing rsync task when it is open for edit', async () => {
      expect(await (await loader.getHarness(IxExplorerHarness.with({ selector: '[formControlName="path"]' }))).getValue()).toBe('/mnt/x/oooo');
      expect(await (await loader.getHarness(
        IxUserComboboxHarness.with({ selector: '[formControlName="user"]' }),
      )).getInputValue()).toBe('root');
      expect(await (await getSelect('direction')).getDisplayText()).toBe('Push');
      expect(await (await getInput('desc')).getValue()).toBe('My rsync task');

      expect(await (await getSelect('mode')).getDisplayText()).toBe('Module');
      expect(await (await getInput('remotehost')).getValue()).toBe('pentagon.gov');
      expect(await (await getInput('remotemodule')).getValue()).toBe('module');

      expect(await (await getCheckbox('recursive')).isChecked()).toBe(true);
      expect(await (await getCheckbox('enabled')).isChecked()).toBe(true);
      expect(await (await getCheckbox('times')).isChecked()).toBe(true);
      expect(await (await getCheckbox('compress')).isChecked()).toBe(true);
      expect(await (await getCheckbox('quiet')).isChecked()).toBe(true);
      expect(await (await getCheckbox('delayupdates')).isChecked()).toBe(true);
    });

    it('saves updated rsync task when form opened for edit is saved', async () => {
      await (await loader.getHarness(IxExplorerHarness.with({ selector: '[formControlName="path"]' }))).setValue('/mnt/new');
      await (await getSelect('direction')).selectOption('Push');

      await setCheckbox('times', false);
      await setCheckbox('compress', false);
      await setCheckbox('delayupdates', true);

      saveForm();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('rsynctask.update', [
        1,
        {
          ...existingTask,
          path: '/mnt/new',
          direction: Direction.Push,
          ssh_credentials: null,
          times: false,
          compress: false,
          delayupdates: true,
        },
      ]);
      expect(closedSpy).toHaveBeenCalledWith(true);
    });

    it('shows SSH fields and saves them when Rsync Mode is SSH and Connect using SSH private key stored in user\'s home directory', async () => {
      await (await getSelect('mode')).selectOption('SSH');
      await (await getInput('remoteport')).setValue('45');
      await (await getInput('remotepath')).setValue('/mnt/path');
      await setCheckbox('validate_rpath', true);
      await (await loader.getHarness(
        TnSlideToggleHarness.with({ selector: '[formControlName="ssh_keyscan"]' }),
      )).check();

      saveForm();

      const existingTaskWithoutModule = { ...existingTask };
      delete existingTaskWithoutModule.remotemodule;

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('rsynctask.update', [
        1,
        {
          ...existingTaskWithoutModule,
          mode: RsyncMode.Ssh,
          remoteport: 45,
          remotepath: '/mnt/path',
          ssh_keyscan: true,
          validate_rpath: true,
          ssh_credentials: null,
        },
      ]);
    });

    it('shows SSH fields and saves them when Rsync Mode is SSH and Connect using SSH connection from the keychain', async () => {
      await (await getSelect('mode')).selectOption('SSH');
      await (await getSelect('sshconnectmode')).selectOption('SSH connection from the keychain');
      await (await loader.getHarness(TnSelectHarness.with({ ancestor: '[formControlName="ssh_credentials"]' }))).selectOption('ssh01');
      await (await getInput('remotepath')).setValue('/mnt/path');

      saveForm();

      const existingTaskWithoutModule = { ...existingTask };
      delete existingTaskWithoutModule.remotemodule;

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('rsynctask.update', [
        1,
        {
          ...existingTaskWithoutModule,
          mode: RsyncMode.Ssh,
          ssh_credentials: 1,
          remotehost: null,
          remoteport: null,
          remotepath: '/mnt/path',
          validate_rpath: true,
        },
      ]);
    });
  });

  describe('host-driven submit', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          taskToEdit: { ...existingTask, id: 1 } as RsyncTask,
        },
      });
      closedSpy = jest.spyOn(spectator.component.closed, 'emit');
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('emits closed and updates when saved via the host submit() entry point', () => {
      closedSpy = jest.spyOn(spectator.component.closed, 'emit');

      spectator.component.submit();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('rsynctask.update', [1, expect.anything()]);
      expect(closedSpy).toHaveBeenCalledWith(true);
    });
  });
});
