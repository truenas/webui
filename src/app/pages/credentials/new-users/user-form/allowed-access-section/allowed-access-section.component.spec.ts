import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { AllowedAccessSectionComponent } from 'app/pages/credentials/new-users/user-form/allowed-access-section/allowed-access-section.component';
import { UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';

describe('AllowedAccessSectionComponent', () => {
  let spectator: Spectator<AllowedAccessSectionComponent>;

  const createComponent = createComponentFactory({
    component: AllowedAccessSectionComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(UserFormStore, {
        setAllowedAccessConfig: jest.fn(),
        updateSetupDetails: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('checks initial value', () => {
    expect(spectator.inject(UserFormStore).setAllowedAccessConfig).toHaveBeenCalledWith({
      smbAccess: true,
      truenasAccess: false,
      sshAccess: false,
      shellAccess: false,
    });
    expect(spectator.inject(UserFormStore).updateSetupDetails).not.toHaveBeenCalledWith({
      role: 'prompt',
    });
  });

  // TODO: Add more tests
});
