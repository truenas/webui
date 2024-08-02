import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { Pool } from 'app/interfaces/pool.interface';

@Component({
  selector: 'ix-pool-status',
  templateUrl: './pool-status.component.html',
  styleUrls: ['../pool-stats.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolStatusComponent {
  readonly pool = input.required<Pool>();

  protected isPoolLoading = computed(() => !this.pool());
}
