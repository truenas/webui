import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { AuthSectionComponent } from 'app/pages/credentials/new-users/user-form/auth-section/auth-section.component';
import { UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';

describe('AuthSectionComponent', () => {
  let spectator: Spectator<AuthSectionComponent>;

  const createComponent = createComponentFactory({
    component: AuthSectionComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(IxValidatorsService, {
        validateOnCondition: jest.fn(),
      }),
      mockProvider(UserFormStore, {
        updateUserConfig: jest.fn(),
        smbAccess: jest.fn(() => false),
        sshAccess: jest.fn(() => false),
        isStigMode: jest.fn(() => false),
        isNewUser: jest.fn(() => true),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('checks initial value', () => {
    expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenCalledWith({
      password: '',
      password_disabled: undefined,
      ssh_password_enabled: false,
      sshpubkey: '',
    });
  });

  // TODO: Add more tests
});
