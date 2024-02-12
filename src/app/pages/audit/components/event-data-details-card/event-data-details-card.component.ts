import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { jsonToYaml } from 'app/helpers/json-to-yaml.helper';
import { convertObjectKeysToHumanReadable } from 'app/helpers/object-keys-to-human-readable.helper';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';

@Component({
  selector: 'ix-event-data-details-card',
  templateUrl: './event-data-details-card.component.html',
  styleUrls: ['./event-data-details-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDataDetailsCardComponent {
  @Input() log: AuditEntry;

  get yamlContent(): string {
    return jsonToYaml(convertObjectKeysToHumanReadable(this.log.event_data));
  }
}
