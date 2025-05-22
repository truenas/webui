import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Choices } from 'app/interfaces/choices.interface';
import { DetailsTableHarness } from 'app/modules/details-table/details-table.harness';
import { IxExplorerHarness } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { AdditionalDetailsSectionComponent } from 'app/pages/credentials/new-users/user-form/additional-details-section/additional-details-section.component';
import { UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';
import { FilesystemService } from 'app/services/filesystem.service';

describe('AdditionalDetailsSectionComponent', () => {
  let spectator: Spectator<AdditionalDetailsSectionComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: AdditionalDetailsSectionComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockProvider(FilesystemService),
      mockProvider(UserFormStore, {
        isStigMode: jest.fn(() => false),
        nextUid: jest.fn(() => 1001),
        updateUserConfig: jest.fn(),
        updateSetupDetails: jest.fn(),
        role: jest.fn(() => 'prompt'),
        isNewUser: jest.fn(() => true),
        shellAccess: jest.fn(() => false),
        homeModeOldValue: jest.fn(() => ''),
      }),
      mockApi([
        mockCall('user.shell_choices', {
          '/usr/bin/bash': 'bash',
          '/usr/bin/zsh': 'zsh',
        } as Choices),
        mockCall('group.query', []),
        mockCall('sharing.smb.query', []),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks initial value when creating a new user', () => {
    expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenCalledWith({
      full_name: '',
      email: null,
      group_create: true,
      groups: [],
      home: '',
      home_mode: '700',
      home_create: false,
      uid: null,
    });
    expect(spectator.inject(UserFormStore).updateSetupDetails).toHaveBeenCalledWith({
      defaultPermissions: true,
    });
  });

  it('loads home share path and puts it in home field', async () => {
    const editables = await loader.getHarness(DetailsTableHarness);
    await editables.setValues({
      'Home Directory': true,
      'Create New Home Directory': true,
    });

    const homeInput = await loader.getHarness(IxExplorerHarness.with({ label: 'Home Directory' }));
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('sharing.smb.query', [[['enabled', '=', true], ['home', '=', true]]]);
    expect(await homeInput.getValue()).toBe('/mnt/users');

    const usernameInput = await loader.getHarness(IxInputHarness.with({ label: 'Username' }));
    await usernameInput.setValue('test');
    expect(await homeInput.getValue()).toBe('/mnt/users');
  });

  // TODO: Add more tests
});
