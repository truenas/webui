import {
  ChangeDetectionStrategy, Component, Input, Type,
} from '@angular/core';
import { EnclosureUi } from 'app/interfaces/enclosure.interface';
import { M50EnclosureComponent } from 'app/pages/system/enclosure/components/enclosures/m50-enclosure/m50-enclosure.component';

@Component({
  selector: 'ix-enclosure-overview',
  templateUrl: './enclosure-overview.component.html',
  styleUrls: ['./enclosure-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnclosureOverviewComponent {
  @Input() enclosure: EnclosureUi; // Enclosure Instance from enclosure-dashboard component

  /** TODO: Change the 'component' type here from one of the enclosures svg components based on
   * which model applies using 'enclosure' input property. https://angular.io/guide/dynamic-component-loader
   */
  machine: { component: Type<unknown>; inputs: { enclosure: EnclosureUi } } = {
    component: M50EnclosureComponent,
    inputs: {
      enclosure: {
        rackmount: true,
        top_loaded: true,
        front_slots: 50,
        rear_slots: 8,
        internal_slots: 4,
        controller: true,
        elements: {
          'Array Device Slot': [],
        },
        id: 'm50',
        label: 'M50',
        model: 'M50',
        name: 'M50',
      },
    },
  };
}
