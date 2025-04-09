import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { UserFormComponent } from 'app/pages/credentials/new-users/user-form/user-form.component';
import { AllUsersHeaderComponent } from './all-users-header.component';

describe('AllUsersHeaderComponent', () => {
  let spectator: Spectator<AllUsersHeaderComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: AllUsersHeaderComponent,
    providers: [
      mockProvider(SlideIn, {
        open: jest.fn(() => of(undefined)),
      }),
      mockProvider(MatDialog),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('elements visibility', () => {
    it('should render Create New User button and open create user form', async () => {
      const createNewUserButton = await loader.getHarness(MatButtonHarness.with({ text: /Add/ }));
      await createNewUserButton.click();

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
        UserFormComponent,
        { wide: false },
      );
    });
  });
});
