import {
  ChangeDetectionStrategy, Component, input, model,
} from '@angular/core';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import {
  TintingFunction,
} from 'app/pages/system/enclosure/components/enclosure-side/enclosure-svg/enclosure-svg.component';

@Component({
  selector: 'ix-not-supported-model',
  templateUrl: './not-supported-model.component.html',
  styleUrls: ['./not-supported-model.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotSupportedModelComponent {
  readonly slots = input<DashboardEnclosureSlot[]>();
  readonly enableMouseEvents = input(true);
  readonly slotTintFn = input<TintingFunction>();
  readonly selectedSlot = model<DashboardEnclosureSlot | null>(null);
}
