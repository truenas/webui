import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { KeyboardShortcutComponent } from 'app/modules/keyboard-shortcut/keyboard-shortcut.component';
import { DetectBrowserService } from 'app/services/detect-browser.service';

describe('KeyboardShortcutComponent', () => {
  let spectator: Spectator<KeyboardShortcutComponent>;
  const createComponent = createComponentFactory({
    component: KeyboardShortcutComponent,
    providers: [
      mockProvider(DetectBrowserService, {
        isMacOs: jest.fn(() => false),
      }),
    ],
  });

  function setupTest(isMacOs = false): void {
    spectator = createComponent({
      props: {
        key: 'f',
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

    it('renders Command + key as shortcut hint on macOS systems', () => {
      expect(spectator.element).toHaveExactText('⌘ + F');
    });

    it('emits (keyPress) when Command + key is pressed', () => {
      spectator.dispatchKeyboardEvent(spectator.element, 'keydown', 'meta.f');

      expect(spectator.component.keyPress.emit).toHaveBeenCalled();
    });
  });

  describe('non-macOS', () => {
    beforeEach(() => {
      setupTest(false);
    });

    it('renders Ctrl + key as shortcut hint on macOS systems', () => {
      expect(spectator.element).toHaveExactText('Ctrl + F');
    });

    it('emits (keyPress) when Ctrl + key is pressed', () => {
      spectator.dispatchKeyboardEvent(spectator.element, 'keydown', 'ctrl.f');

      expect(spectator.component.keyPress.emit).toHaveBeenCalled();
    });
  });
});
