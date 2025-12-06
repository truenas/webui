import { TitleCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Pool } from 'app/interfaces/pool.interface';

@Component({
  selector: 'ix-pool-status',
  templateUrl: './pool-status.component.html',
  styleUrls: ['../pool-stats.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxSkeletonLoaderModule, TranslateModule, TitleCasePipe],
})
export class PoolStatusComponent {
  readonly pool = input<Pool>();
}
