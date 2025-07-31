import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { MatMiniFabButton } from '@angular/material/button';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
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
  private store = inject(EnclosureStore);
  private translate = inject(TranslateService);

  readonly selectedSlot = input.required<DashboardEnclosureSlot>();

  readonly diskName = computed(() => {
    return this.selectedSlot().dev
      || this.translate.instant('Slot: {slot}', { slot: this.selectedSlot().drive_bay_number });
  });

  protected closeDetails(): void {
    this.store.selectSlot(null);
  }
}
