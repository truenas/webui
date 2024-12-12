import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';

@Component({
  selector: 'ix-metadata-details-card',
  templateUrl: './metadata-details-card.component.html',
  styleUrls: ['./metadata-details-card.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardContent,
    MatCardHeader,
    MatCard,
    TranslateModule,
  ],
})
export class MetadataDetailsCardComponent {
  readonly log = input.required<AuditEntry>();
}
