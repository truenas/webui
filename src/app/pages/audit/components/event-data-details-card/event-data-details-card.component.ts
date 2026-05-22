import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnCardComponent } from '@truenas/ui-components';
import { jsonToYaml } from 'app/helpers/json-to-yaml.helper';
import { convertObjectKeysToHumanReadable } from 'app/helpers/object-keys-to-human-readable.helper';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';

@Component({
  selector: 'ix-event-data-details-card',
  templateUrl: './event-data-details-card.component.html',
  styleUrls: ['./event-data-details-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CopyButtonComponent,
    TnCardComponent,
    TranslateModule,
  ],
})
export class EventDataDetailsCardComponent {
  readonly log = input.required<AuditEntry>();

  protected eventData = computed(() => {
    return {
      success: this.log().success,
      ...this.log().event_data,
    };
  });

  protected yamlContent = computed(() => {
    return jsonToYaml(convertObjectKeysToHumanReadable(this.eventData()));
  });
}
