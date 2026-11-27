import {
  ChangeDetectionStrategy, Component, computed, effect, inject, input, output,
} from '@angular/core';
import { KeyboardShortcutService } from 'app/modules/keyboard-shortcut/keyboard-shortcut.service';
import { KeyboardShortcutId } from 'app/modules/keyboard-shortcut/keyboard-shortcuts.const';

/**
 * Renders a hint for a keyboard shortcut from `keyboardShortcuts`
 * and emits an event when Command/Ctrl+Key is pressed.
 */
@Component({
  selector: 'ix-keyboard-shortcut',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./keyboard-shortcut.component.scss'],
  template: '{{ hint() }}',
})
export class KeyboardShortcutComponent {
  private shortcuts = inject(KeyboardShortcutService);

  readonly shortcut = input.required<KeyboardShortcutId>();
  readonly keyPress = output();

  protected readonly hint = computed(() => this.shortcuts.getHint(this.shortcut()));

  constructor() {
    effect((onCleanup) => {
      const unregister = this.shortcuts.register(this.shortcut(), () => this.keyPress.emit());
      onCleanup(unregister);
    });
  }
}
