import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

@Component({
  selector: 'ix-debug-panel-toggle',
  standalone: true,
  imports: [MatButtonModule, MatTooltipModule, IxIconComponent],
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
