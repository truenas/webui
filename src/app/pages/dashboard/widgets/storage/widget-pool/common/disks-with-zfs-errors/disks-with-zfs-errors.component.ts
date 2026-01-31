import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { getDisksWithErrors } from 'app/helpers/disk-errors.helper';
import { Pool } from 'app/interfaces/pool.interface';

@Component({
  selector: 'ix-disks-with-zfs-errors',
  templateUrl: './disks-with-zfs-errors.component.html',
  styleUrls: ['../pool-stats.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxSkeletonLoaderModule, TranslateModule],
})
export class DisksWithZfsErrorsComponent {
  readonly pool = input.required<Pool>();

  protected isPoolLoading = computed(() => !this.pool());

  protected disksWithZfsErrors = computed(() => {
    if (!this.pool()?.topology) {
      return 0;
    }
    return getDisksWithErrors(this.pool().topology).length;
  });
}
