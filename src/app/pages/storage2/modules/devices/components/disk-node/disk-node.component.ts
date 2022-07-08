import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { DiskType } from 'app/enums/disk-type.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { VDevStatus } from 'app/enums/vdev-status.enum';
import { VDev } from 'app/interfaces/storage.interface';
import { WidgetUtils } from 'app/pages/dashboard/utils/widget-utils';

@UntilDestroy()
@Component({
  selector: 'ix-disk-node',
  templateUrl: './disk-node.component.html',
  styleUrls: ['./disk-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskNodeComponent {
  @Input() disk: VDev;
  @Input() type: DiskType;
  @Input() size: number;

  private utils: WidgetUtils;

  constructor(
    protected translate: TranslateService,
  ) {
    this.utils = new WidgetUtils();
  }

  get diskName(): string {
    return this.disk.disk || this.disk.type;
  }

  get diskStatus(): string {
    return this.disk?.status ? this.disk.status : '';
  }

  get diskCapacity(): string {
    return this.size !== null && this.size !== undefined ? this.utils.convert(this.size).value
      + this.utils.convert(this.size).units : '';
  }

  get diskErrors(): string {
    if (this.disk.stats) {
      const errors = this.disk.stats?.checksum_errors + this.disk.stats?.read_errors + this.disk.stats?.write_errors;
      return errors ? `${errors} Errors` : this.translate.instant('No Errors');
    }
    return '';
  }

  get diskIcon(): string {
    let icon = '';
    if (this.disk.children.length) {
      if (this.type === DiskType.Hdd) {
        icon = 'ix-hdd-mirror';
      }
      if (this.type === DiskType.Ssd) {
        icon = 'ix-ssd-mirror';
      }
    } else {
      if (this.type === DiskType.Hdd) {
        icon = 'ix-hdd';
      }
      if (this.type === DiskType.Ssd) {
        icon = 'ix-ssd';
      }
    }
    return icon;
  }

  get statusColor(): string {
    switch (this.disk.status as PoolStatus | VDevStatus) {
      case PoolStatus.Faulted:
        return 'var(--red)';
      case PoolStatus.Offline:
        return 'var(--magenta)';
      default:
        return '';
    }
  }
}
