import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnCardComponent } from '@truenas/ui-components';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';

@Component({
  selector: 'ix-metadata-details-card',
  templateUrl: './metadata-details-card.component.html',
  styleUrls: ['./metadata-details-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TranslateModule,
  ],
})
export class MetadataDetailsCardComponent {
  readonly log = input.required<AuditEntry>();
}
