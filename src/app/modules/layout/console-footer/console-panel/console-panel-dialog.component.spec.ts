import { DialogRef } from '@angular/cdk/dialog';
import { signal } from '@angular/core';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ConsoleMessagesStore } from 'app/modules/layout/console-footer/console-messages.store';
import { ConsolePanelDialog } from 'app/modules/layout/console-footer/console-panel/console-panel-dialog.component';

describe('ConsolePanelDialogComponent', () => {
  let spectator: Spectator<ConsolePanelDialog>;
  let messages: HTMLElement;
  const lines = signal('[12:34] Pod bay door open request received.');

  const createComponent = createComponentFactory({
    component: ConsolePanelDialog,
    providers: [
      mockProvider(ConsoleMessagesStore, { lines }),
      mockProvider(DialogRef),
    ],
  });

  // jsdom has no layout: give the container 10px of height per character, 100px visible.
  function fakeLayout(element: HTMLElement): void {
    Object.defineProperty(element, 'scrollHeight', { get: () => element.textContent!.length * 10 });
    Object.defineProperty(element, 'clientHeight', { get: () => 100 });
  }

  async function addLines(text: string): Promise<void> {
    lines.update((current) => `${current}\n${text}`);
    await spectator.fixture.whenStable();
  }

  beforeEach(() => {
    lines.set('[12:34] Pod bay door open request received.');
    spectator = createComponent();
    messages = spectator.query<HTMLElement>('.messages')!;
    fakeLayout(messages);
  });

  it('shows console messages when they are updated', async () => {
    await addLines('[12:35] Request denied.');

    expect(messages).toHaveText('[12:34] Pod bay door open request received.\n[12:35] Request denied.');
  });

  it('keeps following new lines while the user is at the bottom', async () => {
    await addLines('[12:35] Request denied.');

    expect(messages.scrollTop).toBe(messages.scrollHeight);
  });

  it('stops following new lines once the user scrolls up, and resumes at the bottom', async () => {
    messages.scrollTop = 0;
    spectator.dispatchFakeEvent(messages, 'scroll');

    await addLines('[12:35] Request denied.');
    expect(messages.scrollTop).toBe(0);

    messages.scrollTop = messages.scrollHeight - messages.clientHeight;
    spectator.dispatchFakeEvent(messages, 'scroll');

    await addLines('[12:36] Dave, this conversation can serve no purpose anymore.');
    expect(messages.scrollTop).toBe(messages.scrollHeight);
  });
});
