import {
  ChangeDetectionStrategy, Component, computed,
  signal,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { OverviewInfo } from 'app/pages/system/enclosure/components/views/enclosure-view/disks-overview/disks-overview.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { enclosureComponentMap } from 'app/pages/system/enclosure/utils/enclosure-mappings';

@Component({
  selector: 'ix-enclosure-view',
  templateUrl: './enclosure-view.component.html',
  styleUrls: ['./enclosure-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnclosureViewComponent {
  readonly enclosure = this.store.selectedEnclosure;
  readonly enclosures = this.store.enclosures;
  readonly selectedSlot = this.store.selectedSlot;
  private readonly selectedView = signal<OverviewInfo['name']>('pools');

  protected readonly title = computed(() => {
    return this.translate.instant('Disks on {enclosure}', {
      enclosure: this.store.enclosureLabel(),
    });
  });

  constructor(
    private store: EnclosureStore,
    private translate: TranslateService,
  ) {}

  readonly dashboardView = computed(() => {
    const enclosure = this.enclosure();
    const selectedView = this.selectedView();
    const selectedSlot = this.selectedSlot();
    // TODO: Add error handling for missing models
    return {
      component: enclosureComponentMap['M50'], // TODO: this.enclosure().model
      inputs: {
        enclosure,
        selectedSlot,
        selectedView,
      },
    };
  });

  changeView(viewName: OverviewInfo['name']): void {
    this.selectedView.set(viewName);
  }

  enclosureSelected(enclosureId: string): void {
    this.store.selectEnclosure(enclosureId);
  }
}
