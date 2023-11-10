import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AuditEntry } from 'app/interfaces/audit.interface';

@Component({
  selector: 'ix-metadata-details-card',
  templateUrl: './metadata-details-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetadataDetailsCardComponent {
  @Input() log: AuditEntry;
}
