import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

@UntilDestroy()
@Component({
  selector: 'ix-disk-details-overview',
  templateUrl: './disk-details-overview.component.html',
  styleUrls: ['./disk-details-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskDetailsOverviewComponent {
  readonly selectedSlot = this.store.selectedSlot;

  readonly diskName = computed(() => {
    return this.selectedSlot().dev
      || this.translate.instant('Slot: {slot}', { slot: this.selectedSlot().drive_bay_number });
  });

  constructor(
    private store: EnclosureStore,
    private translate: TranslateService,
  ) {}

  protected closeDetails(): void {
    this.store.selectSlot(null);
  }
}
