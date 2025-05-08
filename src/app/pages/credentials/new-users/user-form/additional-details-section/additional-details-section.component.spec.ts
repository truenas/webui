import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { Choices } from 'app/interfaces/choices.interface';
import { AdditionalDetailsSectionComponent } from 'app/pages/credentials/new-users/user-form/additional-details-section/additional-details-section.component';
import { UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';
import { FilesystemService } from 'app/services/filesystem.service';

describe('AdditionalDetailsSectionComponent', () => {
  let spectator: Spectator<AdditionalDetailsSectionComponent>;

  const createComponent = createComponentFactory({
    component: AdditionalDetailsSectionComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(FilesystemService),
      mockProvider(UserFormStore, {
        isStigMode: jest.fn(() => false),
        nextUid: jest.fn(() => 1001),
        updateUserConfig: jest.fn(),
        updateSetupDetails: jest.fn(),
        role: jest.fn(() => 'prompt'),
        isNewUser: jest.fn(() => true),
        shellAccess: jest.fn(() => false),
      }),
      mockApi([
        mockCall('user.shell_choices', {
          '/usr/bin/bash': 'bash',
          '/usr/bin/zsh': 'zsh',
        } as Choices),
        mockCall('group.query', []),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('checks initial value when creating a new user', () => {
    expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenCalledWith({
      full_name: '',
      email: null,
      group_create: true,
      groups: [],
      home: '',
      home_create: false,
      uid: null,
    });
    expect(spectator.inject(UserFormStore).updateSetupDetails).toHaveBeenCalledWith({
      defaultPermissions: true,
    });
  });

  // TODO: Add more tests
});
