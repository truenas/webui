import {
  Component, Input, OnChanges, OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { Pool, PoolTopology } from 'app/interfaces/pool.interface';
import { VDev } from 'app/interfaces/storage.interface';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
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

const missingDev = 'VDEVs are missing';
const mixedDev = 'Mixed Capacity VDEVs';

@UntilDestroy()
@Component({
  selector: 'ix-widget-topology',
  templateUrl: './widget-topology.component.html',
  styleUrls: ['./widget-topology.component.scss'],
})
export class WidgetTopologyComponent extends WidgetComponent implements OnInit, OnChanges {
  @Input() poolState: Pool;
  @Input() loading = true;
  readonly topologyHealthLevel = TopologyHealthLevel;
  private utils: WidgetUtils;

  topologyState: TopologyState = {
    health: TopologyHealthLevel.Safe,
    data: missingDev,
    metadata: missingDev,
    log: missingDev,
    cache: missingDev,
    spare: missingDev,
    dedup: missingDev,
  };

  get mixedDev(): string {
    return mixedDev;
  }

  constructor(
    public router: Router,
    public translate: TranslateService,
  ) {
    super(translate);
    this.utils = new WidgetUtils();
  }

  ngOnInit(): void {
    if (!this.loading) {
      this.checkVolumeHealth(this.poolState);
      this.parseTopology(this.poolState.topology);
    }
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
    if (topology) {
      this.topologyState.data = this.parseDevs(topology.data);
      this.topologyState.metadata = this.parseDevs(topology.special);
      this.topologyState.log = this.parseDevs(topology.log);
      this.topologyState.cache = this.parseDevs(topology.cache);
      this.topologyState.spare = this.parseDevs(topology.spare);
      this.topologyState.dedup = this.parseDevs(topology.dedup);
    }
  }

  private parseDevs(devs: VDev[]): string {
    let outputString = missingDev;
    let isMix = false;
    let wide = 0;
    const type = devs[0]?.type;
    const size = devs[0]?.children.length ? devs[0]?.children[0]?.stats?.bytes[2] : devs[0]?.stats?.bytes[2];

    devs.forEach((dev) => {
      if (dev.type && dev.type !== type) {
        isMix = true;
      }
      if (!dev.children.length && dev.stats.bytes[2] && dev.stats.bytes[2] !== size) {
        isMix = true;
      }
      dev.children.forEach((child) => {
        wide += 1;
        if (child.stats.bytes[2] && child.stats.bytes[2] !== size) {
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
