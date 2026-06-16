import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnDialog } from '@truenas/ui-components';
import { of } from 'rxjs';
import { ConsoleFooterComponent } from 'app/modules/layout/console-footer/console-footer.component';
import { ConsoleMessagesStore } from 'app/modules/layout/console-footer/console-messages.store';
import { ConsolePanelDialog } from 'app/modules/layout/console-footer/console-panel/console-panel-dialog.component';

describe('ConsoleFooterComponent', () => {
  let spectator: Spectator<ConsoleFooterComponent>;
  const createComponent = createComponentFactory({
    component: ConsoleFooterComponent,
    providers: [
      mockProvider(ConsoleMessagesStore, {
        lastThreeLogLines$: of("[12:35] I'm afraid I can't do that."),
      }),
      mockProvider(TnDialog),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('starts listening for console message updates when component is initiated', () => {
    expect(spectator.inject(ConsoleMessagesStore).subscribeToMessageUpdates).toHaveBeenCalled();
  });

  it('shows last 3 lines of console messages', () => {
    expect(spectator.query('.messages')).toHaveText("[12:35] I'm afraid I can't do that.");
  });

  it('opens ConsolePanelDialogComponent when footer is clicked', () => {
    spectator.click('.messages');

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(ConsolePanelDialog);
  });
});
