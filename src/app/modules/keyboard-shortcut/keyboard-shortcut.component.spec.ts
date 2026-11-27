import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { KeyboardShortcutComponent } from 'app/modules/keyboard-shortcut/keyboard-shortcut.component';
import { DetectBrowserService } from 'app/services/detect-browser.service';

describe('KeyboardShortcutComponent', () => {
  let spectator: Spectator<KeyboardShortcutComponent>;
  const createComponent = createComponentFactory({
    component: KeyboardShortcutComponent,
  });

  function setupTest(isMacOs: boolean): void {
    spectator = createComponent({
      props: {
        shortcut: 'globalSearch',
      },
      providers: [
        mockProvider(DetectBrowserService, {
          isMacOs: jest.fn(() => isMacOs),
        }),
      ],
    });
    jest.spyOn(spectator.component.keyPress, 'emit');
  }

  describe('macOS', () => {
    beforeEach(() => {
      setupTest(true);
    });

    it('renders Command + key as shortcut hint', () => {
      expect(spectator.element).toHaveExactText('⌘ + /');
    });

    it('emits (keyPress) when Command + key is pressed', () => {
      spectator.dispatchKeyboardEvent(document, 'keydown', 'meta./');

      expect(spectator.component.keyPress.emit).toHaveBeenCalled();
    });
  });

  describe('non-macOS', () => {
    beforeEach(() => {
      setupTest(false);
    });

    it('renders Ctrl + key as shortcut hint', () => {
      expect(spectator.element).toHaveExactText('Ctrl + /');
    });

    it('emits (keyPress) when Ctrl + key is pressed', () => {
      spectator.dispatchKeyboardEvent(document, 'keydown', 'ctrl./');

      expect(spectator.component.keyPress.emit).toHaveBeenCalled();
    });

    it('stops emitting once destroyed', () => {
      spectator.fixture.destroy();
      spectator.dispatchKeyboardEvent(document, 'keydown', 'ctrl./');

      expect(spectator.component.keyPress.emit).not.toHaveBeenCalled();
    });
  });
});
