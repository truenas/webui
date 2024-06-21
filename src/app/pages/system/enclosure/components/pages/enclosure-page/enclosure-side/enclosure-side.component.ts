import {
  ChangeDetectionStrategy, Component, computed, input, model,
} from '@angular/core';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { supportedEnclosures, EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';

@Component({
  selector: 'ix-enclosure-side',
  templateUrl: './enclosure-side.component.html',
  styleUrl: './enclosure-side.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnclosureSideComponent {
  readonly enclosure = input.required<DashboardEnclosure>();
  readonly enableMouseEvents = input(true);
  readonly slotTintFn = input<(slot: DashboardEnclosureSlot | null) => string>();
  readonly selectedSlot = model<DashboardEnclosureSlot | null>(null);

  /**
   * When side is not provided will default to showing front or top, depending on what's available.
   */
  readonly side = input<EnclosureSide>(undefined);

  readonly sideSlots = computed(() => {
    return Object.values(this.enclosure().elements[EnclosureElementType.ArrayDeviceSlot]);
  });

  readonly shownSide = computed(() => {
    if (this.side() !== undefined) {
      return this.side();
    }

    return this.enclosure().top_loaded ? EnclosureSide.Top : EnclosureSide.Front;
  });

  protected svgUrl = computed(() => {
    return supportedEnclosures[this.enclosure().model][this.shownSide()];
  });
}
