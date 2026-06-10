import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
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
      mockProvider(DialogRef),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('has Connect button that closes dialog with true', async () => {
    const button = await loader.getHarness(TnButtonHarness.with({ label: 'Connect' }));
    await button.click();

    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
  });

  it('has Signup button that opens registration form and closes dialog', async () => {
    const button = await loader.getHarness(TnButtonHarness.with({ label: 'Signup' }));
    await button.click();

    expect(spectator.inject<Window>(WINDOW).open).toHaveBeenCalledWith('https://portal.truenas.com');
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(false);
  });

  it('has Cancel button that closes dialog', async () => {
    const button = await loader.getHarness(TnButtonHarness.with({ label: 'Cancel' }));
    await button.click();

    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(false);
  });
});
