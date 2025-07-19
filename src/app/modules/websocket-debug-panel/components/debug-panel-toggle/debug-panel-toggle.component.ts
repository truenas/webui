import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';

@Component({
  selector: 'ix-debug-panel-toggle',
  templateUrl: './debug-panel-toggle.component.html',
  styleUrls: ['./debug-panel-toggle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DebugPanelToggleComponent {
  readonly isPanelOpen = input<boolean>();
  readonly hasActiveMocks = input<boolean>();
  readonly togglePanel = output();

  onToggle(): void {
    this.togglePanel.emit();
  }
}
