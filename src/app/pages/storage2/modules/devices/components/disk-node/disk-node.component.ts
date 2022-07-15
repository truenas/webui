import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { VDevStatus } from 'app/enums/vdev-status.enum';
import { Disk, VDev } from 'app/interfaces/storage.interface';
import { WidgetUtils } from 'app/pages/dashboard/utils/widget-utils';

@UntilDestroy()
@Component({
  selector: 'ix-disk-node',
  templateUrl: './disk-node.component.html',
  styleUrls: ['./disk-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskNodeComponent {
  @Input() vdev: VDev;
  @Input() disk: Disk;

  private utils: WidgetUtils;

  constructor(
    protected translate: TranslateService,
  ) {
    this.utils = new WidgetUtils();
  }

  get diskName(): string {
    return this.vdev.disk || this.vdev.type;
  }

  get diskStatus(): string {
    return this.vdev?.status ? this.vdev.status : '';
  }

  get diskCapacity(): string {
    return this.disk && this.disk?.size ? this.utils.convert(this.disk.size).value
      + this.utils.convert(this.disk.size).units : '';
  }

  get diskErrors(): string {
    if (this.vdev.stats) {
      const errors = this.vdev.stats?.checksum_errors + this.vdev.stats?.read_errors + this.vdev.stats?.write_errors;
      return this.translate.instant('{n, plural, =0 {No Errors} one {# Error} other {# Errors}}', { n: errors });
    }
    return '';
  }

  get statusColor(): string {
    switch (this.vdev.status as PoolStatus | VDevStatus) {
      case PoolStatus.Faulted:
        return 'var(--red)';
      case PoolStatus.Offline:
        return 'var(--magenta)';
      default:
        return '';
    }
  }
}
