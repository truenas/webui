import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
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
    it('shows create new user button as disable for now', async () => {
      const createNewUserButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create New User' }));
      expect(await createNewUserButton.isDisabled()).toBe(true);
    });
  });
});
