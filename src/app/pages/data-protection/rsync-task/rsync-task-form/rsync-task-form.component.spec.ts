import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Direction } from 'app/enums/direction.enum';
import { RsyncMode } from 'app/enums/rsync-mode.enum';
import { KeychainCredential } from 'app/interfaces/keychain-credential.interface';
import { RsyncTask } from 'app/interfaces/rsync-task.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  SshCredentialsSelectComponent,
} from 'app/modules/forms/custom-selects/ssh-credentials-select/ssh-credentials-select.component';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { LocaleService } from 'app/services/locale.service';
import { UserService } from 'app/services/user.service';
import { WebSocketService } from 'app/services/ws.service';
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

  const chainedRef: ChainedRef<RsyncTask> = {
    close: jest.fn(),
    getData: jest.fn(() => undefined),
  };

  let spectator: Spectator<RsyncTaskFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
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
      mockWebSocket([
        mockCall('rsynctask.create', existingTask),
        mockCall('rsynctask.update', existingTask),
        mockCall('keychaincredential.query', [
          { id: 1, name: 'ssh01' },
          { id: 2, name: 'ssh02' },
        ] as KeychainCredential[]),
      ]),
      mockProvider(ChainedSlideInService, {
        open: jest.fn(() => of()),
        components$: of([]),
      }),
      mockProvider(FilesystemService),
      mockProvider(UserService, {
        userQueryDsCache: () => of([
          { username: 'root' },
          { username: 'steven' },
        ] as User[]),
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
      mockProvider(ChainedRef, chainedRef),
    ],
  });

  describe('adds a new rsync task', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('adds a new rsync task when new form is saved', async () => {
      await form.fillForm({
        Path: '/mnt/new',
        User: 'steven',
        Direction: 'Pull',
        Description: 'My new task',

        'Remote Host': 'pentagon.gov',
        'Rsync Mode': 'Module',
        'Remote Module Name': 'module',

        Schedule: '0 2 * * *',
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
        'Auxiliary Parameters': ['param=newValue'],
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('rsynctask.create', [{
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
        schedule: {
          dom: '*', dow: '*', hour: '2', minute: '0', month: '*',
        },
        times: false,
        user: 'steven',
      }]);
      expect(chainedRef.close).toHaveBeenCalledWith({ response: existingTask, error: null });
    });
  });

  describe('edits rsync task', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(ChainedRef, { ...chainedRef, getData: jest.fn(() => ({ ...existingTask, id: 1 })) }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('shows values for an existing rsync task when it is open for edit', async () => {
      const values = await form.getValues();

      expect(values).toEqual({
        Path: '/mnt/x/oooo',
        User: 'root',
        Direction: 'Push',
        Description: 'My rsync task',

        'Remote Host': 'pentagon.gov',
        'Rsync Mode': 'Module',
        'Remote Module Name': 'module',

        Schedule: 'Hourly (0 * * * *)  At the start of each hour',
        Recursive: true,
        Enabled: true,

        Times: true,
        Compress: true,
        Archive: false,
        Delete: false,
        Quiet: true,
        'Preserve Permissions': false,
        'Preserve Extended Attributes': false,
        'Delay Updates': true,
        'Auxiliary Parameters': ['param=value'],
      });
    });

    it('saves updated rsync task when form opened for edit is saved', async () => {
      await form.fillForm({
        Path: '/mnt/new',
        Direction: 'Push',

        Times: false,
        Compress: false,
        'Delay Updates': true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('rsynctask.update', [
        1,
        {
          ...existingTask,
          path: '/mnt/new',
          direction: Direction.Push,
          times: false,
          compress: false,
          delayupdates: true,
        },
      ]);
      expect(chainedRef.close).toHaveBeenCalledWith({ response: existingTask, error: null });
    });

    it('shows SSH fields and saves them when Rsync Mode is SSH and Connect using SSH private key stored in user\'s home directory', async () => {
      await form.fillForm(
        {
          'Rsync Mode': 'SSH',
          'Remote SSH Port': 45,
          'Remote Path': '/mnt/path',
          'Validate Remote Path': true,
        },
      );

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      const existingTaskWithoutModule = { ...existingTask };
      delete existingTaskWithoutModule.remotemodule;

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('rsynctask.update', [
        1,
        {
          ...existingTaskWithoutModule,
          mode: RsyncMode.Ssh,
          remoteport: 45,
          remotepath: '/mnt/path',
          ssh_keyscan: false,
          validate_rpath: true,
          ssh_credentials: null,
        },
      ]);
    });

    it('shows SSH fields and saves them when Rsync Mode is SSH and Connect using SSH connection from the keychain', async () => {
      await form.fillForm(
        {
          'Rsync Mode': 'SSH',
          'Connect using:': 'SSH connection from the keychain',
          'SSH Connection': 'ssh01',
          'Remote Path': '/mnt/path',
        },
      );

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      const existingTaskWithoutModule = { ...existingTask };
      delete existingTaskWithoutModule.remotemodule;

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('rsynctask.update', [
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
});
