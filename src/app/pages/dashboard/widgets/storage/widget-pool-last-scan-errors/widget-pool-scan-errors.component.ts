import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { filter, switchMap, tap } from 'rxjs';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetPoolSettings } from 'app/pages/dashboard/widgets/storage/widget-pool/widget-pool.definition';
import { poolLastScanErrorsWidget } from 'app/pages/dashboard/widgets/storage/widget-pool-last-scan-errors/widget-pool-last-scan-errors.definition';

@Component({
  selector: 'ix-widget-pool-last-scan-errors',
  templateUrl: './widget-pool-last-scan-errors.component.html',
  styleUrls: ['./widget-pool-last-scan-errors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetPoolLastScanErrorsComponent implements WidgetComponent {
  size = input.required<SlotSize>();
  settings = input.required<WidgetPoolSettings>();
  poolExists = true;

  protected poolId = computed(() => this.settings()?.poolId || '');

  protected pool = toSignal(toObservable(this.poolId).pipe(
    filter(Boolean),
    switchMap((poolId) => this.resources.getPoolById(+poolId)),
    tap((pool) => {
      this.poolExists = !!pool;
      this.cdr.markForCheck();
    }),
  ));

  readonly name = poolLastScanErrorsWidget.name;

  constructor(
    private resources: WidgetResourcesService,
    private cdr: ChangeDetectorRef,
  ) {}
}
