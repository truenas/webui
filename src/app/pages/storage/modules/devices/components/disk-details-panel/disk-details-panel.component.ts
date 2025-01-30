import {
  ChangeDetectionStrategy,
  Component, computed,
  input, output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { isTopologyDisk, TopologyItem } from 'app/interfaces/storage.interface';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { DiskInfoCardComponent } from 'app/pages/storage/modules/devices/components/disk-info-card/disk-info-card.component';
import { HardwareDiskEncryptionComponent } from 'app/pages/storage/modules/devices/components/hardware-disk-encryption/hardware-disk-encryption.component';
import { SmartInfoCardComponent } from 'app/pages/storage/modules/devices/components/smart-info-card/smart-info-card.component';
import { ZfsInfoCardComponent } from 'app/pages/storage/modules/devices/components/zfs-info-card/zfs-info-card.component';

@Component({
  selector: 'ix-disk-details-panel',
  templateUrl: './disk-details-panel.component.html',
  styleUrls: ['./disk-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ZfsInfoCardComponent,
    HardwareDiskEncryptionComponent,
    SmartInfoCardComponent,
    DiskInfoCardComponent,
    TranslateModule,
    CastPipe,
  ],
})
export class DiskDetailsPanelComponent {
  readonly topologyItem = input.required<TopologyItem>();
  readonly topologyParentItem = input<TopologyItem>();
  readonly disk = input<Disk>();
  readonly poolId = input<number>();
  readonly topologyCategory = input<VdevType>();
  readonly hasTopLevelRaidz = input<boolean>();
  readonly disksWithSmartTestSupport = input<string[]>([]);

  readonly closeMobileDetails = output();

  protected isTopologyDisk = computed(() => {
    return isTopologyDisk(this.topologyItem());
  });

  protected hasTopologyItemDisk = computed(() => {
    if (isTopologyDisk(this.topologyItem())) {
      return this.topologyItem().disk !== null;
    }

    return false;
  });

  protected hasSmartTestSupport = computed(() => {
    const disk = this.disk();
    return disk() && this.disksWithSmartTestSupport().includes(disk.devname);
  });

  onCloseMobileDetails(): void {
    this.closeMobileDetails.emit();
  }
}
