import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { enclosureComponentMap } from 'app/pages/system/enclosure/utils/enclosure-mappings';

@Component({
  selector: 'ix-enclosure-overview',
  templateUrl: './enclosure-overview.component.html',
  styleUrls: ['./enclosure-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnclosureOverviewComponent {
  readonly enclosure = input.required<DashboardEnclosure>();
  readonly selectedSlot = input.required<DashboardEnclosureSlot>();

  readonly machine = computed(() => {
    // TODO: Add error handling for missing models
    return {
      component: enclosureComponentMap['M50'], // TODO: this.enclosure().model
      inputs: {
        enclosure: this.enclosure(),
        selectedSlot: this.selectedSlot(),
      },
    };
  });
}
