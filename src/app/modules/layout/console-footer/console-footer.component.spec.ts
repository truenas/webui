import { signal } from '@angular/core';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnDialog } from '@truenas/ui-components';
import { ConsoleFooterComponent } from 'app/modules/layout/console-footer/console-footer.component';
import { ConsoleMessagesStore } from 'app/modules/layout/console-footer/console-messages.store';
import { ConsolePanelDialog } from 'app/modules/layout/console-footer/console-panel/console-panel-dialog.component';

describe('ConsoleFooterComponent', () => {
  let spectator: Spectator<ConsoleFooterComponent>;
  const lastThreeLogLines = signal("[12:35] I'm afraid I can't do that.");

  const createComponent = createComponentFactory({
    component: ConsoleFooterComponent,
    providers: [
      mockProvider(ConsoleMessagesStore, {
        lastThreeLogLines,
        subscribeToMessageUpdates: jest.fn(),
      }),
      mockProvider(TnDialog),
    ],
  });

  beforeEach(() => {
    lastThreeLogLines.set("[12:35] I'm afraid I can't do that.");
    spectator = createComponent();
  });

  it('starts listening for console message updates when component is initiated', () => {
    expect(spectator.inject(ConsoleMessagesStore).subscribeToMessageUpdates).toHaveBeenCalled();
  });

  it('shows last 3 lines of console messages', () => {
    expect(spectator.query('.messages')).toHaveText("[12:35] I'm afraid I can't do that.");
  });

  it('scrolls to the bottom after new messages are rendered', async () => {
    const messages = spectator.query<HTMLElement>('.messages')!;
    Object.defineProperty(messages, 'scrollHeight', { get: () => messages.textContent!.length });
    messages.scrollTop = 0;

    lastThreeLogLines.set('[12:36] Line 1.\n[12:36] Line 2.\n[12:36] Line 3.');
    await spectator.fixture.whenStable();

    expect(messages).toHaveText('[12:36] Line 3.');
    expect(messages.scrollTop).toBe(messages.textContent!.length);
  });

  it('opens ConsolePanelDialogComponent when footer is clicked', () => {
    spectator.click('.messages');

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(ConsolePanelDialog);
  });
});
