import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { CallResponse } from '@truenas/api-client';
import {
  TnChipInputHarness, TnSelectHarness, TnSlideToggleHarness,
} from '@truenas/ui-components';
import { of, throwError } from 'rxjs';
import { mockApi, mockQuery, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Direction } from 'app/enums/direction.enum';
import { RsyncMode } from 'app/enums/rsync-mode.enum';
import { KeychainCredential } from 'app/interfaces/keychain-credential.interface';
import { RsyncTask } from 'app/interfaces/rsync-task.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import {
  fillControlValues, getControlValues, indexFormControls,
} from 'app/modules/forms/ix-forms/testing/control-harnesses.helpers';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SignalFormErrors } from 'app/modules/forms/signal-forms/signal-form-errors.service';
import { LocaleService } from 'app/modules/language/locale.service';
import { SchedulerHarness } from 'app/modules/scheduler/components/scheduler/scheduler.harness';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { FilesystemService } from 'app/services/filesystem.service';
import { PrincipalOption, UserDirectoryService } from 'app/services/user-directory.service';
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
  let form: Record<string, IxFormControlHarness>;

  const createComponent = createComponentFactory({
    component: RsyncTaskFormComponent,
    providers: [
      mockProvider(LocaleService, {
        timezone: 'America/New_York',
      }),
      mockAuth(),
      mockApi([
        mockQuery('keychaincredential.query', [
          { id: 1, name: 'ssh01' },
          { id: 2, name: 'ssh02' },
        ] as KeychainCredential[]),
        mockCall('rsynctask.create', existingTask as unknown as CallResponse<WebUiApiDirectory, 'rsynctask.create'>),
        mockCall('rsynctask.update', existingTask as unknown as CallResponse<WebUiApiDirectory, 'rsynctask.update'>),
      ]),
      mockProvider(FilesystemService),
      mockProvider(UserDirectoryService, {
        pageSize: 50,
        queryUsers: () => of(['root', 'steven'].map((name) => ({
          label: ignoreTranslation(name), value: name,
        }) as PrincipalOption)),
        userExists: (name: string) => of(name !== 'ghost'),
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

  const setUp = async (taskToEdit?: RsyncTask): Promise<void> => {
    spectator = createComponent({ props: { taskToEdit } });
    closedSpy = jest.spyOn(spectator.component.closed, 'emit');
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    await spectator.fixture.whenStable();
    form = await indexFormControls(loader);
  };

  /** Fills controls by label, re-indexing after each one, since a mode switch adds and removes fields. */
  const fill = async (values: Record<string, unknown>): Promise<void> => {
    for (const [label, value] of Object.entries(values)) {
      await fillControlValues(form, { [label]: value });
      form = await indexFormControls(loader);
    }
  };

  /** The existence check on User runs after a debounce, from an effect. */
  const settleUserCheck = async (): Promise<void> => {
    jest.advanceTimersByTime(1000);
    TestBed.tick();
    await spectator.fixture.whenStable();
  };

  // Panel-hosted form: the `<tn-side-panel>` footer owns Save and calls `submit()`.
  const saveForm = async (): Promise<void> => {
    spectator.component.submit();
    await spectator.fixture.whenStable();
    spectator.detectChanges();
  };

  describe('adds a new rsync task', () => {
    beforeEach(async () => {
      await setUp();
    });

    it('adds a new rsync task when new form is saved', async () => {
      await fill({
        Path: '/mnt/new',
        User: 'steven',
        Direction: 'Pull',
        Description: 'My new task',
        'Rsync Mode': 'Module',
        'Remote Host': 'pentagon.gov',
        'Remote Module Name': 'module',
        Recursive: false,
        Enabled: true,
        Times: false,
        Compress: true,
        Archive: false,
        Delete: true,
        Quiet: true,
        'Preserve Permissions': true,
        'Preserve Extended Attributes': false,
        'Delay Updates': false,
      });
      await (await loader.getHarness(SchedulerHarness.with({ label: 'Schedule' }))).setValue('0 2 * * *');
      await (await loader.getHarness(TnChipInputHarness)).addChip('param=newValue');

      await saveForm();

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

    it('does not let a required field the current mode hides block Save', async () => {
      await fill({
        Path: '/mnt/new',
        User: 'steven',
        Direction: 'Push',
      });
      await (await loader.getHarness(SchedulerHarness.with({ label: 'Schedule' }))).setValue('0 2 * * *');
      // Remote Host and Remote Module Name are required in Module mode and still empty.
      expect(spectator.component.canSubmit()).toBe(false);

      await fill({
        'Rsync Mode': 'SSH',
        'Connect using:': 'SSH connection from the keychain',
      });
      await (await loader.getHarness(TnSelectHarness.with({ ancestor: 'ix-ssh-credentials-select' })))
        .selectOption('ssh01');

      expect(spectator.component.canSubmit()).toBe(true);
    });

    it('marks a user the directory does not know, and blocks Save on it', async () => {
      jest.useFakeTimers();
      try {
        await fill({ User: 'ghost' });
        await settleUserCheck();
        spectator.detectChanges();

        expect(spectator.query('tn-form-field:has(ix-user-combobox)')).toHaveText('User "ghost" does not exist');
        expect(spectator.component.canSubmit()).toBe(false);
      } finally {
        jest.useRealTimers();
      }
    });

    it('sends validation errors from the API to the signal form, naming remotehost as remotepath', async () => {
      const error = new Error('validation');
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(throwError(() => error));
      const errors = spectator.debugElement.injector.get(SignalFormErrors);
      jest.spyOn(errors, 'handleValidationErrors');

      await fill({
        Path: '/mnt/new',
        User: 'steven',
        Direction: 'Push',
        'Remote Host': 'pentagon.gov',
        'Remote Module Name': 'module',
      });
      await (await loader.getHarness(SchedulerHarness.with({ label: 'Schedule' }))).setValue('0 2 * * *');
      await saveForm();

      expect(errors.handleValidationErrors).toHaveBeenCalledWith(error, { remotehost: 'remotepath' });
      expect(closedSpy).not.toHaveBeenCalled();
    });
  });

  describe('edits rsync task', () => {
    beforeEach(async () => {
      await setUp({ ...existingTask, id: 1 });
    });

    it('shows values for an existing rsync task when it is open for edit', async () => {
      expect(await getControlValues(form)).toMatchObject({
        Path: '/mnt/x/oooo',
        User: 'root',
        Direction: 'Push',
        Description: 'My rsync task',
        'Rsync Mode': 'Module',
        'Remote Host': 'pentagon.gov',
        'Remote Module Name': 'module',
        Recursive: true,
        Enabled: true,
        Times: true,
        Compress: true,
        Quiet: true,
        'Delay Updates': true,
      });
      expect(spectator.component.hasUnsavedChanges()).toBe(false);
    });

    it('saves updated rsync task when form opened for edit is saved', async () => {
      await fill({
        Path: '/mnt/new',
        Direction: 'Push',
        Times: false,
        Compress: false,
        'Delay Updates': true,
      });

      await saveForm();

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
      await fill({
        'Rsync Mode': 'SSH',
        'Remote SSH Port': '45',
        'Remote Path': '/mnt/path',
        'Validate Remote Path': true,
      });
      await (await loader.getHarness(TnSlideToggleHarness)).check();

      await saveForm();

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
      await fill({
        'Rsync Mode': 'SSH',
        'Connect using:': 'SSH connection from the keychain',
        'Remote Path': '/mnt/path',
      });
      await (await loader.getHarness(TnSelectHarness.with({ ancestor: 'ix-ssh-credentials-select' })))
        .selectOption('ssh01');

      await saveForm();

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

    it('emits closed and updates when saved via the host submit() entry point', async () => {
      spectator.component.submit();
      await spectator.fixture.whenStable();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('rsynctask.update', [1, expect.anything()]);
      expect(closedSpy).toHaveBeenCalledWith(true);
    });
  });
});
