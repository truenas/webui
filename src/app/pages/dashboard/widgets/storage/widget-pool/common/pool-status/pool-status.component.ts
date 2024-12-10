import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Pool } from 'app/interfaces/pool.interface';

@Component({
  selector: 'ix-pool-status',
  templateUrl: './pool-status.component.html',
  styleUrls: ['../pool-stats.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgxSkeletonLoaderModule, TranslateModule],
})
export class PoolStatusComponent {
  readonly pool = input.required<Pool>();

  protected isPoolLoading = computed(() => !this.pool());
}
