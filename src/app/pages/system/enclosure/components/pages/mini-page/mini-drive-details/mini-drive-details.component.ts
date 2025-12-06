import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import { MatIconAnchor } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { enclosureDiskStatusLabels } from 'app/enums/enclosure-slot-status.enum';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { IdentifyLightComponent } from 'app/pages/system/enclosure/components/identify-light/identify-light.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

@Component({
  selector: 'ix-mini-drive-details',
  templateUrl: './mini-drive-details.component.html',
  styleUrl: './mini-drive-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconAnchor,
    TestDirective,
    IxIconComponent,
    IdentifyLightComponent,
    TranslateModule,
    MapValuePipe,
  ],
})
export class MiniDriveDetailsComponent {
  private store = inject(EnclosureStore);

  readonly slot = input.required<DashboardEnclosureSlot>();

  protected readonly vdevType = VDevType;
  readonly enclosureDiskStatusLabels = enclosureDiskStatusLabels;

  getFriendlyVdevName(vdevName: string, vdevType: VDevType): string {
    // Handle spares
    if (vdevType === VDevType.Spare || vdevType?.includes('spare')) {
      return 'Spare';
    }

    // Handle cache devices
    if (vdevType === VDevType.Cache) {
      return 'Cache';
    }

    // Handle log devices
    if (vdevType === VDevType.Log) {
      return 'Log';
    }

    // Handle special/metadata devices
    if (vdevType === VDevType.Special) {
      return 'Metadata';
    }

    // Handle dedup devices
    if (vdevType === VDevType.Dedup) {
      return 'Dedup';
    }

    // Parse technical VDEV names for data devices
    if (vdevName.includes('raidz')) {
      if (vdevName.includes('raidz3')) return 'RAIDZ3';
      if (vdevName.includes('raidz2')) return 'RAIDZ2';
      if (vdevName.includes('raidz1') || vdevName.startsWith('raidz-')) return 'RAIDZ1';
      return 'RAIDZ';
    }

    if (vdevName.includes('mirror')) {
      return 'Mirror';
    }

    if (vdevName.includes('draid')) {
      if (vdevName.includes('draid3')) return 'dRAID3';
      if (vdevName.includes('draid2')) return 'dRAID2';
      if (vdevName.includes('draid1') || vdevName.startsWith('draid-')) return 'dRAID1';
      return 'dRAID';
    }

    if (vdevName === 'stripe' || vdevName.includes('stripe')) {
      return 'Single Disk';
    }

    // Fallback to original name if we can't parse it
    return vdevName;
  }

  onClosePressed(): void {
    this.store.selectSlot(null);
  }
}
