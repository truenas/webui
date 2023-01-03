import {
  Component, Input, OnChanges, OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import filesize from 'filesize';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { Pool, PoolTopology } from 'app/interfaces/pool.interface';
import { StorageDashboardDisk, TopologyDisk, TopologyItem } from 'app/interfaces/storage.interface';

interface TopologyState {
  data: string;
  metadata: string;
  log: string;
  cache: string;
  spare: string;
  dedup: string;
}

const notAssignedDev = 'VDEVs not assigned';
const mixedCapacity = 'Mixed Capacity VDEVs';
const mixedWidth = 'Mixed Width VDEVs';

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

  get mixedCapacity(): string {
    return mixedCapacity;
  }

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

    this.topologyState.data = this.parseDevs(topology.data);
    this.topologyState.metadata = this.parseDevs(topology.special);
    this.topologyState.log = this.parseDevs(topology.log);
    this.topologyState.cache = this.parseDevs(topology.cache);
    this.topologyState.spare = this.parseDevs(topology.spare);
    this.topologyState.dedup = this.parseDevs(topology.dedup);
  }

  private parseDevs(devs: TopologyItem[]): string {
    let outputString = notAssignedDev;
    let isMixedCapacity = false;
    let isMixedWidth = false;
    let vdevWidth = 0;

    const allVdevWidths = new Set<number>(); // There should only be one value
    const type = devs[0]?.type;
    const size = devs[0]?.children.length
      ? this.disks?.find((disk) => disk.name === devs[0]?.children[0]?.disk)?.size
      : this.disks?.find((disk) => disk.name === (devs[0] as TopologyDisk)?.disk)?.size;

    devs.forEach((dev) => {
      if (dev.type && dev.type !== type) {
        isMixedCapacity = true;
      }
      if (!dev.children.length && this.disks?.find((disk) => disk.name === (dev as TopologyDisk).disk)?.size !== size) {
        isMixedCapacity = true;
      }

      let vdevWidthCounter = 0;
      dev.children.forEach((child) => {
        vdevWidthCounter += 1;
        if (this.disks?.find((disk) => disk.name === child.disk)?.size !== size) {
          isMixedCapacity = true;
        }
      });
      allVdevWidths.add(vdevWidthCounter);
    });

    if (allVdevWidths.size > 1) {
      isMixedWidth = true;
    } else {
      vdevWidth = allVdevWidths.values().next().value;
    }

    if (devs.length) {
      if (isMixedCapacity) {
        outputString = mixedCapacity;
      } else if (isMixedWidth) {
        outputString = mixedWidth;
      } else {
        outputString = `${devs.length} x `;
        outputString += vdevWidth ? `${type} | ${vdevWidth} wide | ` : '';
        if (size) {
          outputString += filesize(size, { standard: 'iec' });
        } else {
          outputString += '?';
        }
      }
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
}
