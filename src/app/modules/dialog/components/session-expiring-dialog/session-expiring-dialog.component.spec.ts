import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnDialogHarness } from '@truenas/ui-components';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
import { PreferencesFormComponent } from 'app/modules/layout/topbar/user-menu/preferences-form/preferences-form.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
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
      { provide: DIALOG_DATA, useValue: options },
      mockProvider(DialogRef),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(NavigateAndHighlightService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows dialog title', async () => {
    const dialog = await loader.getHarness(TnDialogHarness);
    expect(await dialog.getTitle()).toBe(options.title);
  });

  it('shows dialog message', () => {
    expect(spectator.query('.message-content')).toHaveText(options.message);
  });

  it('closes dialog with true when extend session button is pressed', async () => {
    const button = await loader.getHarness(TnButtonHarness.with({ label: options.buttonText }));
    await button.click();

    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
  });

  it('opens preferences slide-in and highlights session timeout when preferences link is clicked', () => {
    jest.useFakeTimers();

    const preferencesLink = spectator.query('.preferences-link')!;
    spectator.click(preferencesLink);

    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      PreferencesFormComponent,
      { title: 'Preferences' },
    );

    jest.runAllTimers();

    expect(spectator.inject(NavigateAndHighlightService).waitForElement).toHaveBeenCalledWith('session-timeout');

    jest.useRealTimers();
  });
});
