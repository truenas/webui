import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AuditEntry } from 'app/interfaces/audit.interface';

@Component({
  selector: 'ix-log-details-panel',
  templateUrl: './log-details-panel.component.html',
  styleUrls: ['./log-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogDetailsPanelComponent {
  @Input() log: AuditEntry;

  @Output() hide = new EventEmitter();

  onCloseMobileDetails(): void {
    this.hide.emit();
  }
}
