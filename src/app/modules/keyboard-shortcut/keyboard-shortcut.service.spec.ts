import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { KeyboardShortcutService } from 'app/modules/keyboard-shortcut/keyboard-shortcut.service';
import { KeyboardShortcutId, keyboardShortcuts } from 'app/modules/keyboard-shortcut/keyboard-shortcuts.const';
import { DetectBrowserService } from 'app/services/detect-browser.service';

describe('KeyboardShortcutService', () => {
  let spectator: SpectatorService<KeyboardShortcutService>;
  let isMacOs = false;
  let handler: jest.Mock;
  let unregisters: (() => void)[] = [];

  const createService = createServiceFactory({
    service: KeyboardShortcutService,
    providers: [
      mockProvider(DetectBrowserService, {
        isMacOs: jest.fn(() => isMacOs),
      }),
    ],
  });

  function press(init: KeyboardEventInit, target: EventTarget = document.body): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
  }

  beforeEach(() => {
    isMacOs = false;
    handler = jest.fn();
    spectator = createService();
    register('toggleSidenav', handler);
  });

  // Root services are not destroyed between tests, so the previous test's service still listens
  // on `document`: drop its handlers, or it acts on (and prevents) this test's key presses.
  function register(id: KeyboardShortcutId, shortcutHandler: () => void): () => void {
    const unregister = spectator.service.register(id, shortcutHandler);
    unregisters.push(unregister);
    return unregister;
  }

  afterEach(() => {
    unregisters.forEach((unregister) => unregister());
    unregisters = [];
    document.body.innerHTML = '';
  });

  it('defines every shortcut on a different key', () => {
    const keys = Object.values(keyboardShortcuts).map((shortcut) => shortcut.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('runs the handler and stops the browser default on Ctrl + key outside macOS', () => {
    const event = press({ key: 'b', ctrlKey: true });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('uses Command instead of Ctrl on macOS', () => {
    isMacOs = true;

    press({ key: 'b', ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();

    press({ key: 'b', metaKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('ignores the key without the modifier or with extra modifiers', () => {
    const plain = press({ key: 'b' });
    press({ key: 'B', ctrlKey: true, shiftKey: true });
    press({ key: 'b', ctrlKey: true, altKey: true });
    press({ key: 'b', ctrlKey: true, metaKey: true });

    expect(handler).not.toHaveBeenCalled();
    expect(plain.defaultPrevented).toBe(false);
  });

  it('does not fire while typing in a text field', () => {
    const input = document.createElement('input');
    const textarea = document.createElement('textarea');
    document.body.append(input, textarea);

    const event = press({ key: 'b', ctrlKey: true }, input);
    press({ key: 'b', ctrlKey: true }, textarea);

    expect(handler).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('fires while focus is on a checkbox', () => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    document.body.append(checkbox);

    press({ key: 'b', ctrlKey: true }, checkbox);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('fires in a text field when the shortcut allows it', () => {
    const searchHandler = jest.fn();
    register('globalSearch', searchHandler);
    const input = document.createElement('input');
    document.body.append(input);

    press({ key: '/', ctrlKey: true }, input);

    expect(searchHandler).toHaveBeenCalledTimes(1);
  });

  it('does not fire while a dialog or side panel is open', () => {
    const dialog = document.createElement('div');
    dialog.className = 'cdk-dialog-container';
    document.body.append(dialog);
    press({ key: 'b', ctrlKey: true });

    dialog.className = 'tn-side-panel__overlay--open';
    press({ key: 'b', ctrlKey: true });

    expect(handler).not.toHaveBeenCalled();
  });

  it('stops running the handler once unregistered', () => {
    const unregister = register('toggleSidenav', handler);
    unregister();

    press({ key: 'b', ctrlKey: true });

    expect(handler).not.toHaveBeenCalled();
  });

  it('builds a platform-specific hint', () => {
    expect(spectator.service.getHint('toggleSidenav')).toBe('Ctrl + B');

    isMacOs = true;
    expect(spectator.service.getHint('toggleSidenav')).toBe('⌘ + B');
  });
});
