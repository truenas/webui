import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { ConsolePanelDialogComponent } from 'app/modules/common/dialog/console-panel/console-panel-dialog.component';
import { ConsoleMessagesStore } from 'app/modules/layout/components/console-footer/console-messages.store';

describe('ConsolePanelDialogComponent', () => {
  let spectator: Spectator<ConsolePanelDialogComponent>;
  const createComponent = createComponentFactory({
    component: ConsolePanelDialogComponent,
    providers: [
      mockProvider(ConsoleMessagesStore, {
        lines$: of('[12:34] Pod bay door open request received.'),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows console messages when they are updated', () => {
    expect(spectator.query('.messages')).toHaveText('[12:34] Pod bay door open request received.');
  });
});
