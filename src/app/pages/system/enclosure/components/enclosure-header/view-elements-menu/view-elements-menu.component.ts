import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { Router } from '@angular/router';
import { EnclosureElementType, enclosureElementTypeLabels } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';

export interface ViewOption {
  url: string[];
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

    return Object.keys(enclosure.elements)
      .map((view: EnclosureElementType) => {
        let url = ['/system/viewenclosure', String(enclosure.id)];

        if (view !== EnclosureElementType.ArrayDeviceSlot) {
          url = [...url, view];
        }

        return {
          url,
          label: enclosureElementTypeLabels.has(view) ? enclosureElementTypeLabels.get(view) : view,
        };
      });
  });

  constructor(
    private router: Router,
  ) {}

  protected changeView(option: ViewOption): void {
    this.router.navigate(option.url);
  }
}
