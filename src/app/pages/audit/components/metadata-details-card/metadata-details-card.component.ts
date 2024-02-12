import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';

@Component({
  selector: 'ix-metadata-details-card',
  templateUrl: './metadata-details-card.component.html',
  styleUrls: ['./metadata-details-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetadataDetailsCardComponent {
  @Input() log: AuditEntry;
}
