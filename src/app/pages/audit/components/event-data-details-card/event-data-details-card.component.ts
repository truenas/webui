import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { jsonToYaml } from 'app/helpers/json-to-yaml.helper';
import { convertObjectKeysToHumanReadable } from 'app/helpers/object-keys-to-human-readable.helper';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';

@Component({
  selector: 'ix-event-data-details-card',
  templateUrl: './event-data-details-card.component.html',
  styleUrls: ['./event-data-details-card.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CopyButtonComponent,
    MatCard,
    MatCardHeader,
    MatCardContent,
    TranslateModule,
  ],
})
export class EventDataDetailsCardComponent {
  readonly log = input.required<AuditEntry>();

  protected yamlContent = computed(() => {
    return jsonToYaml(convertObjectKeysToHumanReadable(this.log().event_data));
  });
}
