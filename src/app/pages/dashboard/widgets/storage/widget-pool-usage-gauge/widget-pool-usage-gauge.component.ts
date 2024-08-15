import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { filter, switchMap, tap } from 'rxjs';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetPoolSettings } from 'app/pages/dashboard/widgets/storage/widget-pool/widget-pool.definition';
import { poolUsageGaugeWidget } from 'app/pages/dashboard/widgets/storage/widget-pool-usage-gauge/widget-pool-usage-gauge.definition';

@Component({
  selector: 'ix-widget-pool-usage-gauge',
  templateUrl: './widget-pool-usage-gauge.component.html',
  styleUrls: ['./widget-pool-usage-gauge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetPoolUsageGaugeComponent implements WidgetComponent {
  size = input.required<SlotSize>();
  settings = input.required<WidgetPoolSettings>();
  poolExists = true;
  readonly SlotSize = SlotSize;

  protected poolId = computed(() => this.settings()?.poolId || '');

  protected pool = toSignal(toObservable(this.poolId).pipe(
    filter(Boolean),
    switchMap((poolId) => this.resources.getPoolById(poolId)),
    tap((pool) => {
      this.poolExists = !!pool;
      this.cdr.markForCheck();
    }),
  ));

  readonly name = poolUsageGaugeWidget.name;

  constructor(
    private resources: WidgetResourcesService,
    private cdr: ChangeDetectorRef,
  ) {}
}
