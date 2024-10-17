import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { filter, switchMap, tap } from 'rxjs';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import { WidgetPoolSettings, poolWidget } from 'app/pages/dashboard/widgets/storage/widget-pool/widget-pool.definition';
import { DisksWithZfsErrorsComponent } from './common/disks-with-zfs-errors/disks-with-zfs-errors.component';
import { LastScanErrorsComponent } from './common/last-scan-errors/last-scan-errors.component';
import { PoolStatusComponent } from './common/pool-status/pool-status.component';
import { PoolUsageGaugeComponent } from './common/pool-usage-gauge/pool-usage-gauge.component';

@Component({
  selector: 'ix-widget-pool',
  templateUrl: './widget-pool.component.html',
  styleUrls: ['./widget-pool.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    MatIconButton,
    TestDirective,
    MatTooltip,
    RouterLink,
    IxIconComponent,
    PoolUsageGaugeComponent,
    PoolStatusComponent,
    DisksWithZfsErrorsComponent,
    LastScanErrorsComponent,
    WidgetDatapointComponent,
    TranslateModule,
  ],
})
export class WidgetPoolComponent implements WidgetComponent {
  size = input.required<SlotSize>();
  settings = input.required<WidgetPoolSettings>();
  poolExists = true;

  protected poolId = computed(() => this.settings()?.poolId || '');

  protected pool = toSignal(toObservable(this.poolId).pipe(
    filter(Boolean),
    switchMap((poolId) => this.resources.getPoolById(poolId)),
    tap((pool) => {
      this.poolExists = !!pool;
      this.cdr.markForCheck();
    }),
  ));

  readonly name = poolWidget.name;

  constructor(
    private resources: WidgetResourcesService,
    private cdr: ChangeDetectorRef,
  ) {}
}
