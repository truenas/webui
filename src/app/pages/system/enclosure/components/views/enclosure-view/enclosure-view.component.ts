import {
  ChangeDetectionStrategy, Component, computed,
  signal,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EnclosureView, OverviewInfo } from 'app/pages/system/enclosure/components/views/enclosure-view/disks-overview/disks-overview.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureSide, enclosureComponentMap } from 'app/pages/system/enclosure/utils/enclosure-mappings';

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
  readonly EnclosureSide = EnclosureSide;
  protected readonly selectedView = signal<OverviewInfo['name']>(EnclosureView.Pools);

  protected readonly expanders = computed(() => {
    const expanders = this.enclosure().elements['SAS Expander'];
    return Object.values(expanders);
  });

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
    const selectedViewOption = this.selectedViewOption();
    // TODO: Add error handling for missing models
    return {
      component: enclosureComponentMap[this.enclosure().model][selectedViewOption],
      inputs: {
        enclosure,
        viewOption: selectedViewOption,
      },
    };
  });

  readonly frontOrTopLoadedEnclosure = computed(() => {
    const enclosure = this.enclosure();
    return enclosure.top_loaded ? EnclosureSide.Top : EnclosureSide.Front;
  });

  readonly selectedViewOption = signal(this.frontOrTopLoadedEnclosure());

  changeView(viewName: OverviewInfo['name']): void {
    this.selectedView.set(viewName);
  }

  enclosureSelected(enclosureId: string): void {
    this.store.selectEnclosure(enclosureId);
  }
}
