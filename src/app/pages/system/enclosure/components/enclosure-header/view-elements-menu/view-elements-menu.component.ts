import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EnclosureElementType, enclosureElementTypeLabels } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';

export interface ViewOption {
  href: string;
  label: string;
}

@Component({
  selector: 'ix-view-elements-menu',
  templateUrl: './view-elements-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewElementsMenuComponent {
  readonly enclosure = input.required<DashboardEnclosure>();

  readonly views = computed<ViewOption[]>(() => {
    const enclosure = this.enclosure();
    const supportedViews = [
      EnclosureElementType.ArrayDeviceSlot,
      EnclosureElementType.TemperatureSensors,
      EnclosureElementType.Cooling,
      EnclosureElementType.VoltageSensor,
      EnclosureElementType.PowerSupply,
      EnclosureElementType.SasConnector,
      EnclosureElementType.EnclosureServicesControllerElectronics,
    ] as const;

    return supportedViews
      .filter((view) => enclosure.elements[view])
      .map((view) => {
        let href = `${enclosure.id}/${view}`;

        if (view === EnclosureElementType.ArrayDeviceSlot) {
          href = String(enclosure.id);
        }

        return {
          href,
          label: enclosureElementTypeLabels.has(view) ? enclosureElementTypeLabels.get(view) : view,
        };
      });
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  protected changeView(option: ViewOption): void {
    this.router.navigate([option.href], { relativeTo: this.route });
  }
}
