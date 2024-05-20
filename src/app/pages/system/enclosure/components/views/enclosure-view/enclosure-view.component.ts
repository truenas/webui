import {
  ChangeDetectionStrategy, Component, computed,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
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
  readonly selectedSlot = this.store.selectedSlot;

  protected readonly title = computed(() => {
    return this.translate.instant('Disks on {enclosure}', {
      enclosure: this.store.enclosureLabel(),
    });
  });

  constructor(
    private store: EnclosureStore,
    private translate: TranslateService,
  ) {}

  readonly machine = computed(() => {
    // TODO: Add error handling for missing models
    return {
      component: enclosureComponentMap['M50'], // TODO: this.enclosure().model
      inputs: {
        enclosure: this.enclosure(),
        selectedSlot: this.selectedSlot(),
      },
    };
  });
}
