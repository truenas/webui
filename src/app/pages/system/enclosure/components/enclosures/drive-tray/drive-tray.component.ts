import {
  ChangeDetectionStrategy, Component, computed, input, output, signal,
} from '@angular/core';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[ixDriveTray]',
  templateUrl: './drive-tray.component.svg',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveTrayComponent {
  readonly slot = input.required<DashboardEnclosureSlot>();
  readonly selected = input.required<boolean>();

  readonly traySelected = output();

  readonly isEmpty = computed(() => !this.slot().pool_info);

  // TODO: Try with CSS
  readonly highlight = signal(false);
}
