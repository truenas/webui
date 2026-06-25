import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
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

  it('emits addUser when the Add button is clicked', async () => {
    const emitSpy = jest.spyOn(spectator.component.addUser, 'emit');

    const addButton = await loader.getHarness(MatButtonHarness.with({ text: /Add/ }));
    await addButton.click();

    expect(emitSpy).toHaveBeenCalledWith();
  });
});
