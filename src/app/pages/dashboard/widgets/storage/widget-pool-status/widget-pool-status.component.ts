import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { filter, switchMap, tap } from 'rxjs';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetPoolSettings } from 'app/pages/dashboard/widgets/storage/widget-pool/widget-pool.definition';
import { poolStatusWidget } from 'app/pages/dashboard/widgets/storage/widget-pool-status/widget-pool-status.definition';

@Component({
  selector: 'ix-widget-pool-status',
  templateUrl: './widget-pool-status.component.html',
  styleUrls: ['./widget-pool-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetPoolStatusComponent implements WidgetComponent {
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

  readonly name = poolStatusWidget.name;

  constructor(
    private resources: WidgetResourcesService,
    private cdr: ChangeDetectorRef,
  ) {}
}
