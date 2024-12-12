import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { EnclosureSideComponent } from 'app/pages/system/enclosure/components/enclosure-side/enclosure-side.component';
import { EnclosureSideSwitchComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-side-switch/enclosure-side-switch.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { diskStatusTint } from 'app/pages/system/enclosure/utils/disk-status-tint.utils';
import { StatusesLegendComponent } from './statuses-legend/statuses-legend.component';

@Component({
  selector: 'ix-status-view',
  templateUrl: './status-view.component.html',
  styleUrl: '../_enclosure-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    EnclosureSideComponent,
    EnclosureSideSwitchComponent,
    StatusesLegendComponent,
    TranslateModule,
  ],
})
export class StatusViewComponent {
  readonly enclosure = this.store.selectedEnclosure;
  readonly selectedSlot = this.store.selectedSlot;
  readonly selectedEnclosureSlots = this.store.selectedEnclosureSlots;
  readonly selectedSide = this.store.selectedSide;
  readonly hasMoreThanOneSide = this.store.hasMoreThanOneSide;

  constructor(
    private store: EnclosureStore,
  ) {}

  protected onSlotSelected(slot: DashboardEnclosureSlot): void {
    this.store.selectSlot(slot.drive_bay_number);
  }

  readonly diskStatusTint = diskStatusTint;
}
