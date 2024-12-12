import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Pool } from 'app/interfaces/pool.interface';

@Component({
  selector: 'ix-disks-with-zfs-errors',
  templateUrl: './disks-with-zfs-errors.component.html',
  styleUrls: ['../pool-stats.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgxSkeletonLoaderModule, TranslateModule],
})
export class DisksWithZfsErrorsComponent {
  readonly pool = input.required<Pool>();

  protected isPoolLoading = computed(() => !this.pool());

  protected totalZfsErrors = computed(() => {
    if (!this.pool()?.topology) {
      return 0;
    }
    return Object.values(this.pool().topology).reduce((totalErrors, vdevs) => {
      return totalErrors + vdevs.reduce((vdevCategoryErrors, vdev) => {
        return vdevCategoryErrors
          + (vdev.stats?.read_errors || 0)
          + (vdev.stats?.write_errors || 0)
          + (vdev.stats?.checksum_errors || 0);
      }, 0);
    }, 0);
  });
}
