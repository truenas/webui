import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { RsyncModuleMode } from 'app/enums/rsync-mode.enum';
import { RsyncModule } from 'app/interfaces/rsync-module.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { UserService, WebSocketService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { RsyncModuleFormComponent } from './rsync-module-form.component';

describe('RsyncModuleFormComponent', () => {
  const existingModule: RsyncModule = {
    id: 1,
    auxiliary: 'aux',
    comment: 'My module',
    hostsdeny: ['yahoo.com'],
    enabled: true,
    group: 'kmem',
    hostsallow: ['google.com'],
    locked: false,
    maxconn: 2,
    mode: RsyncModuleMode.ReadAndWrite,
    name: 'test',
    path: '/mnt/x/oooo',
    user: 'daemon',
  };

  let spectator: Spectator<RsyncModuleFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: RsyncModuleFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('rsyncmod.create'),
        mockCall('rsyncmod.update'),
      ]),
      mockProvider(FilesystemService, {
        getFilesystemNodeProvider: jest.fn(() => {
          return () => {
            return of([]);
          };
        }),
      }),
      mockProvider(IxSlideInService),
      mockProvider(UserService, {
        groupQueryDsCache: () => of([
          { group: 'kmem' },
          { group: 'wheel' },
        ]),
        userQueryDsCache: () => of([
          { username: 'daemon' },
          { username: 'games' },
        ]),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('adds a new rsync module when a new form is submitted', async () => {
    await form.fillForm({
      Name: 'new',
      Path: '/mnt/new',
      Comment: 'New module',
      Enabled: true,

      'Access Mode': 'Read Only',
      'Max Connections': '20',
      User: 'games',
      Group: 'wheel',
      'Hosts Allow': ['host1.com'],
      'Hosts Deny': ['host2.com'],

      'Auxiliary Parameters': 'newParam=2',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('rsyncmod.create', [{
      name: 'new',
      path: '/mnt/new',
      comment: 'New module',
      enabled: true,

      mode: RsyncModuleMode.ReadOnly,
      maxconn: 20,
      user: 'games',
      group: 'wheel',
      hostsallow: ['host1.com'],
      hostsdeny: ['host2.com'],

      auxiliary: 'newParam=2',
    }]);
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });

  it('shows current rsync values when it is opened for edit', async () => {
    spectator.component.setModuleForEdit(existingModule);
    const values = await form.getValues();

    expect(values).toEqual({
      Name: 'test',
      Path: '/mnt/x/oooo',
      Comment: 'My module',
      Enabled: true,

      'Access Mode': 'Read and Write',
      'Max Connections': '2',
      User: 'daemon',
      Group: 'kmem',
      'Hosts Allow': ['google.com'],
      'Hosts Deny': ['yahoo.com'],

      'Auxiliary Parameters': 'aux',
    });
  });

  it('saves current rsync values when edit form is submitted', async () => {
    spectator.component.setModuleForEdit(existingModule);

    await form.fillForm({
      Enabled: false,
      'Access Mode': 'Write Only',
      'Hosts Allow': ['192.110.1.2'],
      'Hosts Deny': [],
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('rsyncmod.update', [
      1,
      {
        name: 'test',
        path: '/mnt/x/oooo',
        comment: 'My module',
        enabled: false,

        mode: RsyncModuleMode.WriteOnly,
        maxconn: 2,
        user: 'daemon',
        group: 'kmem',
        hostsallow: ['192.110.1.2'],
        hostsdeny: [],

        auxiliary: 'aux',
      },
    ]);
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });
});
