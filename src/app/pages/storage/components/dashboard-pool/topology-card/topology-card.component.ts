import {
  Component, Input, OnChanges, OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import filesize from 'filesize';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { VdevType, TopologyWarning } from 'app/enums/v-dev-type.enum';
import { Pool, PoolTopology } from 'app/interfaces/pool.interface';
import { SmartTestResult } from 'app/interfaces/smart-test.interface';
import {
  Disk,
  EnclosureAndSlot,
  StorageDashboardDisk,
  TopologyDisk,
  TopologyItem,
} from 'app/interfaces/storage.interface';
import { StorageService } from 'app/services';

interface TopologyState {
  data: string;
  metadata: string;
  log: string;
  cache: string;
  spare: string;
  dedup: string;
}

interface EmptyDiskObject {
  [p: string]: string | number | boolean | string[] | SmartTestResult[] | EnclosureAndSlot;
}

const notAssignedDev = 'VDEVs not assigned';
const multiWarning = 'warnings';

@UntilDestroy()
@Component({
  selector: 'ix-topology-card',
  templateUrl: './topology-card.component.html',
  styleUrls: ['./topology-card.component.scss'],
})
export class TopologyCardComponent implements OnInit, OnChanges {
  @Input() poolState: Pool;
  @Input() disks: StorageDashboardDisk[];

  topologyState: TopologyState = {
    data: notAssignedDev,
    metadata: notAssignedDev,
    log: notAssignedDev,
    cache: notAssignedDev,
    spare: notAssignedDev,
    dedup: notAssignedDev,
  };

  get iconType(): PoolCardIconType {
    if (this.isStatusError(this.poolState)) {
      return PoolCardIconType.Error;
    }
    if (this.isStatusWarning(this.poolState) || !this.poolState.healthy) {
      return PoolCardIconType.Warn;
    }
    return PoolCardIconType.Safe;
  }

  get iconTooltip(): string {
    if (this.isStatusError(this.poolState) || this.isStatusWarning(this.poolState)) {
      return this.translate.instant('Pool contains {status} Data VDEVs', { status: this.poolState.status });
    }
    if (!this.poolState.healthy) {
      return this.translate.instant('Pool is not healthy');
    }
    return this.translate.instant('Everything is fine');
  }

  constructor(
    public router: Router,
    public translate: TranslateService,
    public storageService: StorageService,
  ) {}

  ngOnInit(): void {
    this.parseTopology(this.poolState.topology);
  }

  ngOnChanges(): void {
    this.parseTopology(this.poolState.topology);
  }

  parseTopology(topology: PoolTopology): void {
    if (!topology) {
      return;
    }

    this.topologyState.data = this.parseDevs(topology.data, VdevType.Data);
    this.topologyState.log = this.parseDevs(topology.log, VdevType.Log);
    this.topologyState.cache = this.parseDevs(topology.cache, VdevType.Cache);
    this.topologyState.spare = this.parseDevs(topology.spare, VdevType.Spare);

    this.topologyState.metadata = this.parseDevs(
      topology.special,
      VdevType.Special,
      topology.data,
    );
    this.topologyState.dedup = this.parseDevs(
      topology.dedup,
      VdevType.Dedup,
      topology.data,
    );
  }

  private parseDevs(
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

  private isStatusError(poolState: Pool): boolean {
    return [
      PoolStatus.Faulted,
      PoolStatus.Unavailable,
      PoolStatus.Removed,
    ].includes(poolState.status);
  }

  private isStatusWarning(poolState: Pool): boolean {
    return [
      PoolStatus.Locked,
      PoolStatus.Unknown,
      PoolStatus.Offline,
      PoolStatus.Degraded,
    ].includes(poolState.status);
  }

  isTopologyWarning(topologyState: string): boolean {
    if (topologyState.includes(multiWarning)) {
      return true;
    }

    switch (topologyState) {
      case TopologyWarning.NoRedundancy:
      case TopologyWarning.RedundancyMismatch:
      case TopologyWarning.MixedVdevLayout:
      case TopologyWarning.MixedVdevCapacity:
      case TopologyWarning.MixedDiskCapacity:
      case TopologyWarning.MixedVdevWidth:
        return true;
      default:
        return false;
    }
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
