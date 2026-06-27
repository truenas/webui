import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AllUsersHeaderComponent } from './all-users-header.component';

describe('AllUsersHeaderComponent', () => {
  let spectator: Spectator<AllUsersHeaderComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: AllUsersHeaderComponent,
    providers: [
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('should render Create New User button and open create user form', async () => {
    const emitSpy = jest.spyOn(spectator.component.addUser, 'emit');

    const createNewUserButton = await loader.getHarness(TnButtonHarness.with({ label: /Add/ }));
    await createNewUserButton.click();

    expect(emitSpy).toHaveBeenCalledWith();
  });
});
