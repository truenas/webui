import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { OverviewInfo } from 'app/pages/system/enclosure/components/views/enclosure-view/disks-overview/disks-overview.component';
import { EnclosureComponent } from 'app/pages/system/enclosure/interfaces/enclosure-component.interface';

@Component({
  selector: 'ix-m50-enclosure',
  templateUrl: './m50-enclosure.component.html',
  styleUrl: './m50-enclosure.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class M50EnclosureComponent implements EnclosureComponent {
  readonly selectedView = input.required<OverviewInfo['name']>();
  readonly enclosure = input.required<DashboardEnclosure>();
  readonly selectedSlot = input.required<DashboardEnclosureSlot>();

  protected readonly expanders = computed(() => {
    const expanders = this.enclosure().elements['SAS Expander'];
    return Object.values(expanders);
  });
}
