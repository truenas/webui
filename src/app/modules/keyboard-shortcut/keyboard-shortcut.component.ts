import {
  ChangeDetectionStrategy, Component, computed, HostListener, input, output,
} from '@angular/core';
import { DetectBrowserService } from 'app/services/detect-browser.service';

/**
 * Renders a hint for keyboard shortcut
 * and emits an event when Command/Ctrl+Key is pressed.
 */
@Component({
  selector: 'ix-keyboard-shortcut',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./keyboard-shortcut.component.scss'],
  standalone: true,
  template: '{{ shortcutString() }}',
})
export class KeyboardShortcutComponent {
  readonly key = input.required<string>();
  readonly keyPress = output();

  readonly shortcutString = computed(() => {
    const commandKey = this.detectBrowser.isMacOs() ? '⌘' : 'Ctrl';
    return `${commandKey} + ${this.key().toLocaleUpperCase()}`;
  });

  constructor(
    private detectBrowser: DetectBrowserService,
  ) {}

  @HostListener('window:keydown', ['$event'])
  globalShortcut(event: KeyboardEvent): void {
    const wasCommandKeyPressed = this.detectBrowser.isMacOs() ? event.metaKey : event.ctrlKey;
    if (event.key === this.key() && wasCommandKeyPressed) {
      this.keyPress.emit();
    }
  }
}
