import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { TnIconButtonComponent } from '@truenas/ui-components';

@Component({
  selector: 'ix-debug-panel-toggle',
  standalone: true,
  imports: [TnIconButtonComponent],
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
