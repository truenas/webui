import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
import { PreferencesFormComponent } from 'app/modules/layout/topbar/user-menu/preferences-form/preferences-form.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import {
  SessionExpiringDialog,
  SessionExpiringDialogOptions,
} from './session-expiring-dialog.component';

describe('SessionExpiringDialog', () => {
  let spectator: Spectator<SessionExpiringDialog>;
  let loader: HarnessLoader;

  const options: SessionExpiringDialogOptions = {
    title: 'Session Expiring',
    message: 'Your session is about to expire.',
    buttonText: 'Extend Session',
  };

  const createComponent = createComponentFactory({
    component: SessionExpiringDialog,
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: options },
      mockProvider(MatDialogRef),
      mockProvider(SlideIn, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(NavigateAndHighlightService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows dialog title', () => {
    expect(spectator.query('h1')).toHaveText(options.title);
  });

  it('shows dialog message', () => {
    expect(spectator.query('.message-content')).toHaveText(options.message);
  });

  it('closes dialog with true when extend session button is pressed', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: options.buttonText }));
    await button.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });

  it('opens preferences slide-in and highlights session timeout when preferences link is clicked', () => {
    jest.useFakeTimers();

    const preferencesLink = spectator.query('.preferences-link')!;
    spectator.click(preferencesLink);

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(PreferencesFormComponent);

    jest.runAllTimers();

    expect(spectator.inject(NavigateAndHighlightService).waitForElement).toHaveBeenCalledWith('session-timeout');

    jest.useRealTimers();
  });
});
