import {
  ChangeDetectionStrategy, Component, computed, input, model,
} from '@angular/core';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import {
  TintingFunction,
} from 'app/pages/system/enclosure/components/enclosure-side/enclosure-svg/enclosure-svg.component';
import { getDefaultSide } from 'app/pages/system/enclosure/utils/get-default-side.utils';
import { getSlotsOfSide } from 'app/pages/system/enclosure/utils/get-slots-of-side.utils';
import { EnclosureSide, supportedEnclosures } from 'app/pages/system/enclosure/utils/supported-enclosures';
import { EnclosureSvgComponent } from './enclosure-svg/enclosure-svg.component';
import { NotSupportedModelComponent } from './not-supported-model/not-supported-model.component';

// TODO: It may be a good idea to make this into a separate module.
@Component({
  selector: 'ix-enclosure-side',
  templateUrl: './enclosure-side.component.html',
  styleUrl: './enclosure-side.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [EnclosureSvgComponent, NotSupportedModelComponent],
})
export class EnclosureSideComponent {
  readonly enclosure = input.required<DashboardEnclosure>();
  readonly enableMouseEvents = input(true);
  readonly slotTintFn = input<TintingFunction>();
  readonly selectedSlot = model<DashboardEnclosureSlot | null>(null);

  /**
   * When side is not provided will default to showing front or top, depending on what's available.
   */
  readonly side = input<EnclosureSide>(undefined);

  readonly sideSlots = computed(() => {
    return getSlotsOfSide(this.enclosure(), this.shownSide());
  });

  readonly shownSide = computed(() => {
    if (this.side() !== undefined) {
      return this.side();
    }

    return getDefaultSide(this.enclosure());
  });

  protected svgUrl = computed(() => {
    return supportedEnclosures?.[this.enclosure().model]?.[this.shownSide()];
  });
}
