import {
  ChangeDetectionStrategy,
  Component, computed, input,
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { AppStats } from 'app/interfaces/app.interface';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';

@Component({
  selector: 'ix-app-total-row',
  templateUrl: './app-total-row.component.html',
  styleUrls: ['./app-total-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    MatTooltip,
    NetworkSpeedPipe,
    FileSizePipe,
  ],
})
export class AppTotalRowComponent {
  readonly allStats = input.required<AppStats[]>();

  readonly totalCpu = computed(() => {
    return this.allStats().reduce((sum, stats) => sum + (stats?.cpu_usage || 0), 0);
  });

  readonly totalMemory = computed(() => {
    return this.allStats().reduce((sum, stats) => sum + (stats?.memory || 0), 0);
  });

  readonly totalBlkioRead = computed(() => {
    return this.allStats().reduce((sum, stats) => sum + (stats?.blkio?.read || 0), 0);
  });

  readonly totalBlkioWrite = computed(() => {
    return this.allStats().reduce((sum, stats) => sum + (stats?.blkio?.write || 0), 0);
  });

  readonly totalIncomingTrafficBits = computed(() => {
    return this.allStats().reduce((sum, stats) => {
      if (!stats?.networks?.length) return sum;
      return sum + stats.networks.reduce((netSum, net) => netSum + this.bytesToBits(net.rx_bytes), 0);
    }, 0);
  });

  readonly totalOutgoingTrafficBits = computed(() => {
    return this.allStats().reduce((sum, stats) => {
      if (!stats?.networks?.length) return sum;
      return sum + stats.networks.reduce((netSum, net) => netSum + this.bytesToBits(net.tx_bytes), 0);
    }, 0);
  });

  private bytesToBits(bytes: number): number {
    if (bytes == null) {
      return 0;
    }
    return bytes * 8;
  }
}
