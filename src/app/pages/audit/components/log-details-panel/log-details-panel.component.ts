import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuditEntry } from 'app/interfaces/audit.interface';

@Component({
  selector: 'ix-log-details-panel',
  templateUrl: './log-details-panel.component.html',
  styleUrls: ['./log-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogDetailsPanelComponent {
  @Input() log: AuditEntry;

  constructor(private router: Router) {}

  onCloseMobileDetails(): void {
    this.router.navigate(['/audit'], { state: { hideMobileDetails: true } });
  }
}
