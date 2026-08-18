import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnMenuComponent,
  TnMenuItemComponent,
  TnMenuTriggerDirective,
} from '@truenas/ui-components';
import { EnclosureElementType, enclosureElementTypeLabels } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import { normalizeTestIdString } from 'app/modules/test-id/normalize-test-id.utils';

export interface ViewOption {
  url: string[];
  label: string;
  /**
   * Pre-normalized so the id keeps resolving off the untranslated source label, exactly as
   * `[ixTest]="view.label"` did before the label gained a `translate` pipe.
   */
  testId: string;
}

@Component({
  selector: 'ix-view-elements-menu',
  templateUrl: './view-elements-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnButtonComponent,
    TnMenuComponent,
    TnMenuItemComponent,
    TnMenuTriggerDirective,
    TranslateModule,
  ],
})
export class ViewElementsMenuComponent {
  private router = inject(Router);

  readonly enclosure = input.required<DashboardEnclosure>();

  protected readonly views = computed<ViewOption[]>(() => {
    const enclosure = this.enclosure();

    return Object.keys(enclosure.elements)
      .map((view: EnclosureElementType) => {
        let url = ['/system/viewenclosure', String(enclosure.id)];

        if (view !== EnclosureElementType.ArrayDeviceSlot) {
          url = [...url, view];
        }

        const label = enclosureElementTypeLabels.has(view) ? enclosureElementTypeLabels.get(view) : view;

        return {
          url,
          label,
          testId: normalizeTestIdString(label),
        };
      });
  });

  protected changeView(option: ViewOption): void {
    this.router.navigate(option.url);
  }
}
