import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Pool } from 'app/interfaces/pool.interface';

@Component({
  selector: 'ix-last-scan-errors',
  templateUrl: './last-scan-errors.component.html',
  styleUrls: ['../pool-stats.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxSkeletonLoaderModule, TranslateModule],
})
export class LastScanErrorsComponent {
  readonly pool = input<Pool>();

  protected isPoolLoading = computed(() => !this.pool());
}
