import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';

@Component({
  selector: 'ix-log-details-panel',
  templateUrl: './log-details-panel.component.html',
  styleUrls: ['./log-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogDetailsPanelComponent {
  readonly log = input.required<AuditEntry>();

  readonly hide = output();

  onCloseMobileDetails(): void {
    this.hide.emit();
  }
}
