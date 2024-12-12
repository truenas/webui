import {
  ChangeDetectionStrategy, Component, computed,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { EnclosureDiskStatus, EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureView } from 'app/pages/system/enclosure/types/enclosure-view.enum';

@Component({
  selector: 'ix-disks-overview',
  templateUrl: './disks-overview.component.html',
  styleUrls: ['./disks-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class DisksOverviewComponent {
  readonly selectedView = this.enclosureStore.selectedView;
  readonly selectedEnclosure = this.enclosureStore.selectedEnclosure;
  readonly selectedEnclosureSlots = this.enclosureStore.selectedEnclosureSlots;

  protected readonly EnclosureView = EnclosureView;

  constructor(
    private enclosureStore: EnclosureStore,
  ) {}

  readonly poolsInfo = computed(() => {
    const slots = this.selectedEnclosureSlots();
    return [
      ...new Map(
        slots.filter((slot) => slot.pool_info).map((slot) => [slot.pool_info.pool_name, slot.pool_info]),
      ).values(),
    ];
  });

  readonly expanders = computed(() => {
    return [...Object.values(this.selectedEnclosure().elements?.[EnclosureElementType.SasExpander] || {})];
  });

  readonly unhealthyPoolsInfo = computed(() => {
    return this.poolsInfo().filter((info) => info.disk_status !== EnclosureDiskStatus.Online);
  });

  readonly failedDisks = computed(() => {
    const slots = this.selectedEnclosureSlots();
    return slots.filter((slot) => slot.pool_info?.disk_status === EnclosureDiskStatus.Faulted);
  });

  protected setCurrentView(viewName: EnclosureView): void {
    this.enclosureStore.selectView(viewName);
  }
}
