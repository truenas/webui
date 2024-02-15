import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { WINDOW } from 'app/helpers/window.helper';
import {
  TruecommandSignupModalComponent,
} from 'app/modules/truecommand/components/truecommand-signup-modal/truecommand-signup-modal.component';

describe('TruecommandSignupModalComponent', () => {
  let spectator: Spectator<TruecommandSignupModalComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: TruecommandSignupModalComponent,
    providers: [
      mockWindow({
        open: jest.fn(),
      }),
      mockProvider(MatDialogRef),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('has Connect button that closes dialog with true', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Connect' }));
    await button.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });

  it('has Signup button that opens registration form and closes dialog', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Signup' }));
    await button.click();

    expect(spectator.inject<Window>(WINDOW).open).toHaveBeenCalledWith('https://portal.ixsystems.com');
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(false);
  });

  it('has Cancel button that closes dialog', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Cancel' }));
    await button.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(false);
  });
});
