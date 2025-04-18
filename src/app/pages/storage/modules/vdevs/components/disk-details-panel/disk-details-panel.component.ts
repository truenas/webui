import {
  ChangeDetectionStrategy,
  Component, computed,
  input, output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { isTopologyDisk, VDevItem } from 'app/interfaces/storage.interface';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { DiskInfoCardComponent } from 'app/pages/storage/modules/vdevs/components/disk-info-card/disk-info-card.component';
import { HardwareDiskEncryptionComponent } from 'app/pages/storage/modules/vdevs/components/hardware-disk-encryption/hardware-disk-encryption.component';
import { ZfsInfoCardComponent } from 'app/pages/storage/modules/vdevs/components/zfs-info-card/zfs-info-card.component';

@Component({
  selector: 'ix-disk-details-panel',
  templateUrl: './disk-details-panel.component.html',
  styleUrls: ['./disk-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ZfsInfoCardComponent,
    HardwareDiskEncryptionComponent,
    DiskInfoCardComponent,
    TranslateModule,
    CastPipe,
  ],
})
export class DiskDetailsPanelComponent {
  readonly topologyItem = input.required<VDevItem>();
  readonly topologyParentItem = input<VDevItem>();
  readonly disk = input<Disk>();
  readonly poolId = input<number>();
  readonly topologyCategory = input<VDevType>();
  readonly hasTopLevelRaidz = input<boolean>();

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

  onCloseMobileDetails(): void {
    this.closeMobileDetails.emit();
  }
}
