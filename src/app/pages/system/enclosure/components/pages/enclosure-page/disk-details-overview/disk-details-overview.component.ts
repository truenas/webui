import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatMiniFabButton } from '@angular/material/button';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DiskIconComponent } from 'app/modules/disk-icon/disk-icon.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { IdentifyLightComponent } from 'app/pages/system/enclosure/components/identify-light/identify-light.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { DiskDetailsComponent } from './disks-overview-details/disk-details.component';

@UntilDestroy()
@Component({
  selector: 'ix-disk-details-overview',
  templateUrl: './disk-details-overview.component.html',
  styleUrls: ['./disk-details-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatMiniFabButton,
    TestDirective,
    IxIconComponent,
    DiskIconComponent,
    IdentifyLightComponent,
    DiskDetailsComponent,
    TranslateModule,
    FileSizePipe,
  ],
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
