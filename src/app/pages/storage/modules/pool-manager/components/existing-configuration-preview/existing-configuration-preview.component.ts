import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import filesize from 'filesize';
import { VdevType, vdevTypeLabels } from 'app/enums/v-dev-type.enum';
import { PoolTopology } from 'app/interfaces/pool.interface';
import {
  Disk, StorageDashboardDisk, TopologyDisk, TopologyItem,
} from 'app/interfaces/storage.interface';
import { EmptyDiskObject } from 'app/pages/storage/components/dashboard-pool/topology-card/topology-card.component';
import { StorageService } from 'app/services';

const notAssignedDev = 'VDEVs not assigned';
const multiWarning = 'warnings';

@UntilDestroy()
@Component({
  selector: 'ix-existing-configuration-preview',
  templateUrl: './existing-configuration-preview.component.html',
  styleUrls: ['./existing-configuration-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExistingConfigurationPreviewComponent {
  protected readonly vdevTypeLabels = vdevTypeLabels;

  VdevType = VdevType;
  @Input() name: string;
  @Input() topology: PoolTopology;
  @Input() size: number;
  @Input() disks: Disk[];

  getCategory(key: string): VdevType {
    return key as VdevType;
  }

  constructor(
    private translate: TranslateService,
    private storageService: StorageService,
  ) {}

  get unknownProp(): string {
    return this.translate.instant('None');
  }

  protected parseDevs(
    vdevs: TopologyItem[],
    category: VdevType,
    dataVdevs?: TopologyItem[],
  ): string {
    const disks: Disk[] = this.disks.map((disk: StorageDashboardDisk) => {
      return this.dashboardDiskToDisk(disk);
    });
    const warnings = this.storageService.validateVdevs(category, vdevs, disks, dataVdevs);

    let outputString = vdevs.length ? '' : notAssignedDev;

    // Check VDEV Widths
    let vdevWidth = 0;

    // There should only be one value
    const allVdevWidths: Set<number> = this.storageService.getVdevWidths(vdevs);
    const isMixedWidth = this.storageService.isMixedWidth(allVdevWidths);
    let isSingleDeviceCategory = false;

    switch (category) {
      case VdevType.Spare:
      case VdevType.Cache:
        isSingleDeviceCategory = true;
    }

    if (!isMixedWidth && !isSingleDeviceCategory) {
      vdevWidth = Array.from(allVdevWidths.values())[0];
    }

    if (warnings.length === 1) {
      return warnings[0];
    }

    if (warnings.length > 1) {
      return warnings.length.toString() + ' ' + multiWarning;
    }

    if (!warnings.length && outputString && outputString === notAssignedDev) {
      return outputString;
    }

    const type = vdevs[0]?.type;
    const size = vdevs[0]?.children.length
      ? this.disks?.find((disk) => disk.name === vdevs[0]?.children[0]?.disk)?.size
      : this.disks?.find((disk) => disk.name === (vdevs[0] as TopologyDisk)?.disk)?.size;

    outputString = `${vdevs.length} x `;
    outputString += vdevWidth ? `${type} | ${vdevWidth} wide | ` : '';

    if (size) {
      outputString += filesize(size, { standard: 'iec' });
    } else {
      outputString += '?';
    }

    return outputString;
  }

  dashboardDiskToDisk(dashDisk: StorageDashboardDisk): Disk {
    const output: EmptyDiskObject | Disk = {};
    const keys: string[] = Object.keys(dashDisk);
    keys.forEach((key: keyof StorageDashboardDisk) => {
      if (
        key === 'alerts'
        || key === 'smartTestsRunning'
        || key === 'smartTestsFailed'
        || key === 'tempAggregates'
      ) {
        return;
      }

      output[key as keyof Disk] = dashDisk[key];
    });

    return output as unknown as Disk;
  }
}
