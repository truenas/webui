import {
  ChangeDetectionStrategy,
  Component,
  Input, output,
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { isTopologyDisk, TopologyItem } from 'app/interfaces/storage.interface';
import { MobileBackButtonComponent } from 'app/modules/buttons/mobile-back-button/mobile-back-button.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { DiskInfoCardComponent } from 'app/pages/storage/modules/devices/components/disk-info-card/disk-info-card.component';
import { HardwareDiskEncryptionComponent } from 'app/pages/storage/modules/devices/components/hardware-disk-encryption/hardware-disk-encryption.component';
import { SmartInfoCardComponent } from 'app/pages/storage/modules/devices/components/smart-info-card/smart-info-card.component';
import { TopologyItemIconComponent } from 'app/pages/storage/modules/devices/components/topology-item-icon/topology-item-icon.component';
import { ZfsInfoCardComponent } from 'app/pages/storage/modules/devices/components/zfs-info-card/zfs-info-card.component';

@Component({
  selector: 'ix-disk-details-panel',
  templateUrl: './disk-details-panel.component.html',
  styleUrls: ['./disk-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TestDirective,
    IxIconComponent,
    MatTooltip,
    TopologyItemIconComponent,
    ZfsInfoCardComponent,
    HardwareDiskEncryptionComponent,
    SmartInfoCardComponent,
    DiskInfoCardComponent,
    TranslateModule,
    CastPipe,
    MobileBackButtonComponent,
  ],
})
export class DiskDetailsPanelComponent {
  @Input() topologyItem: TopologyItem;
  @Input() topologyParentItem: TopologyItem;
  @Input() disk: Disk;
  @Input() poolId: number;
  @Input() topologyCategory: VdevType;
  @Input() hasTopLevelRaidz: boolean;
  @Input() disksWithSmartTestSupport: string[];

  readonly closeMobileDetails = output();

  get title(): string {
    if (isTopologyDisk(this.topologyItem)) {
      return this.topologyItem.disk || this.topologyItem.guid;
    }

    return this.topologyItem.type;
  }

  get isTopologyDisk(): boolean {
    return isTopologyDisk(this.topologyItem);
  }

  get hasTopologyItemDisk(): boolean {
    if (isTopologyDisk(this.topologyItem)) {
      return this.topologyItem.disk !== null;
    }

    return false;
  }

  get hasSmartTestSupport(): boolean {
    return this.disksWithSmartTestSupport.includes(this.disk.devname);
  }

  onCloseMobileDetails(): void {
    this.closeMobileDetails.emit();
  }
}
