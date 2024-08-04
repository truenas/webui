import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { Pool } from 'app/interfaces/pool.interface';

@Component({
  selector: 'ix-last-scan-errors',
  templateUrl: './last-scan-errors.component.html',
  styleUrls: ['../pool-stats.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LastScanErrorsComponent {
  readonly pool = input.required<Pool>();

  protected isPoolLoading = computed(() => !this.pool());
}
