import {
  ChangeDetectionStrategy, Component, computed,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EnclosureDiskStatus } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureView } from 'app/pages/system/enclosure/types/enclosure-view.enum';

export interface OverviewInfo {
  name: EnclosureView;
  value: number;
  title: string;
  subtitle: string;
  buttonLabel: string;
}

@Component({
  selector: 'ix-disks-overview',
  templateUrl: './disks-overview.component.html',
  styleUrls: ['./disks-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisksOverviewComponent {
  readonly selectedSlot = this.enclosureStore.selectedSlot;
  readonly selectedView = this.enclosureStore.selectedView;
  readonly selectedEnclosure = this.enclosureStore.selectedEnclosure;
  readonly overviewInfo = computed(() => this.getOverviewInfo(this.selectedEnclosure()));

  get diskName(): string {
    return this.selectedSlot().dev || this.selectedSlot().descriptor;
  }

  constructor(
    private enclosureStore: EnclosureStore,
    private translate: TranslateService,
  ) {}

  closeDetails(): void {
    this.enclosureStore.selectSlot(null);
  }

  setCurrentView(viewName: OverviewInfo['name']): void {
    this.enclosureStore.selectView(viewName);
  }

  // TODO: Break apart.
  private getOverviewInfo(enclosure: DashboardEnclosure): OverviewInfo[] {
    const slots = [...Object.values(enclosure.elements?.['Array Device Slot'] || {})];
    const expanders = [...Object.values(enclosure.elements?.['SAS Expander'] || {})];
    const poolsInfo = [
      ...new Map(
        slots.filter((slot) => slot.pool_info).map((slot) => [slot.pool_info.pool_name, slot.pool_info]),
      ).values(),
    ];
    const unhealthyPoolsInfo = poolsInfo.filter((info) => info.disk_status !== EnclosureDiskStatus.Online);
    const failedPoolsInfo = poolsInfo.filter((info) => {
      return info.disk_read_errors || info.disk_write_errors || info.disk_checksum_errors;
    });
    const failsCount = failedPoolsInfo.reduce((sum, info) => {
      return sum + info.disk_read_errors || 0 + info.disk_write_errors || 0 + info.disk_checksum_errors || 0;
    }, 0);

    const poolsTitle = this.translate.instant('{n, plural, one {Pool in Enclosure} other {Pools in Enclosure}}', { n: poolsInfo.length });
    const failedDisksTitle = this.translate.instant('{n, plural, one {Failed Disk} other {Failed Disks}}', { n: failsCount });
    const expandersTitle = this.translate.instant('{n, plural, one {SAS Expander} other {SAS Expanders}}', { n: expanders.length });

    let poolsSubtitle = this.translate.instant('All pools are online.');
    if (unhealthyPoolsInfo.length === 1) {
      poolsSubtitle = this.translate.instant('Pool {name} is {status}.', {
        name: unhealthyPoolsInfo[0].pool_name,
        status: unhealthyPoolsInfo[0].disk_status,
      });
    } else if (unhealthyPoolsInfo.length > 1) {
      poolsSubtitle = this.translate.instant('{name} and {n, plural, one {# other pool} other {# other pools}} are not healthy.', {
        name: unhealthyPoolsInfo[0].pool_name,
        n: unhealthyPoolsInfo.length - 1,
      });
    }

    let failsSubtitle = this.translate.instant('All disks healthy.');
    if (failedPoolsInfo.length === 1) {
      failsSubtitle = this.translate.instant('Check {name}.', {
        name: failedPoolsInfo[0].vdev_name,
      });
    } else if (failedPoolsInfo.length > 1) {
      failsSubtitle = this.translate.instant('Check {name} and {n, plural, one {# other disk} other {# other disks}}.', {
        name: failedPoolsInfo[0].vdev_name,
        n: failedPoolsInfo.length - 1,
      });
    }

    const overviewInfo: OverviewInfo[] = [
      {
        name: EnclosureView.Pools,
        value: poolsInfo.length,
        title: poolsTitle,
        subtitle: poolsSubtitle,
        buttonLabel: this.translate.instant('SHOW POOLS'),
      },
      {
        name: EnclosureView.DiskStatus,
        value: failsCount,
        title: failedDisksTitle,
        subtitle: failsSubtitle,
        buttonLabel: this.translate.instant('SHOW STATUS'),
      },
    ];

    if (expanders.length) {
      overviewInfo.push({
        name: EnclosureView.Expanders,
        value: expanders.length,
        title: expandersTitle,
        // TODO: Avoid breaking strings apart.
        subtitle: this.translate.instant('on this enclosure.'),
        buttonLabel: this.translate.instant('SHOW EXPANDER STATUS'),
      });
    }

    return overviewInfo;
  }
}
