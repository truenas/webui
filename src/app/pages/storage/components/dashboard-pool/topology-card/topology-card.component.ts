import {
  Component, Input, OnChanges, OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { Pool, PoolTopology } from 'app/interfaces/pool.interface';
import { StorageDashboardDisk, TopologyDisk, TopologyItem } from 'app/interfaces/storage.interface';
import { WidgetUtils } from 'app/pages/dashboard/utils/widget-utils';

interface TopologyState {
  health: TopologyHealthLevel;
  data: string;
  metadata: string;
  log: string;
  cache: string;
  spare: string;
  dedup: string;
}

export enum TopologyHealthLevel {
  Warn = 'warn',
  Error = 'error',
  Safe = 'safe',
}

const notAssignedDev = 'VDEVs not assigned';
const mixedDev = 'Mixed Capacity VDEVs';

@UntilDestroy()
@Component({
  selector: 'ix-topology-card',
  templateUrl: './topology-card.component.html',
  styleUrls: ['./topology-card.component.scss'],
})
export class TopologyCardComponent implements OnInit, OnChanges {
  @Input() poolState: Pool;
  @Input() disks: StorageDashboardDisk[];
  readonly topologyHealthLevel = TopologyHealthLevel;
  private utils: WidgetUtils;

  topologyState: TopologyState = {
    health: TopologyHealthLevel.Safe,
    data: notAssignedDev,
    metadata: notAssignedDev,
    log: notAssignedDev,
    cache: notAssignedDev,
    spare: notAssignedDev,
    dedup: notAssignedDev,
  };

  get mixedDev(): string {
    return mixedDev;
  }

  constructor(
    public router: Router,
    public translate: TranslateService,
  ) {
    this.utils = new WidgetUtils();
  }

  ngOnInit(): void {
    this.checkVolumeHealth(this.poolState);
    this.parseTopology(this.poolState.topology);
  }

  ngOnChanges(): void {
    this.ngOnInit();
  }

  private checkVolumeHealth(poolState: Pool): void {
    const isError = this.isStatusError(poolState);
    const isWarning = this.isStatusWarning(poolState);

    if (isError) {
      this.topologyState.health = TopologyHealthLevel.Error;
    } else if (isWarning || !poolState.healthy) {
      this.topologyState.health = TopologyHealthLevel.Warn;
    } else {
      this.topologyState.health = TopologyHealthLevel.Safe;
    }
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
    let isMix = false;
    let wide = 0;
    const type = devs[0]?.type;
    const size = devs[0]?.children.length
      ? this.disks.find((disk) => disk.name === devs[0]?.children[0]?.disk)?.size
      : this.disks.find((disk) => disk.name === (devs[0] as TopologyDisk)?.disk)?.size;

    devs.forEach((dev) => {
      if (dev.type && dev.type !== type) {
        isMix = true;
      }
      if (!dev.children.length && this.disks.find((disk) => disk.name === (dev as TopologyDisk).disk)?.size !== size) {
        isMix = true;
      }
      dev.children.forEach((child) => {
        wide += 1;
        if (this.disks.find((disk) => disk.name === child.disk)?.size !== size) {
          isMix = true;
        }
      });
    });

    if (devs.length) {
      if (isMix) {
        outputString = mixedDev;
      } else {
        outputString = `${devs.length} x `;
        outputString += wide ? `${type} | ${wide} wide | ` : '';
        outputString += this.utils.convert(size).value;
        outputString += this.utils.convert(size).units;
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
