import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  combineLatest, filter, switchMap, tap,
} from 'rxjs';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetPoolSettings, poolWidget } from 'app/pages/dashboard/widgets/storage/widget-pool/widget-pool.definition';

@Component({
  selector: 'ix-widget-pool',
  templateUrl: './widget-pool.component.html',
  styleUrls: ['./widget-pool.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetPoolComponent implements WidgetComponent {
  size = input.required<SlotSize>();
  settings = input.required<WidgetPoolSettings>();
  poolExists = true;

  protected poolId = computed(() => this.settings()?.poolId || '');

  protected poolName = computed(() => this.settings()?.name?.split(':')[1] || '');

  protected pool = toSignal(combineLatest([toObservable(this.poolName), toObservable(this.poolId)]).pipe(
    filter(([name, id]) => !!name || !!id),
    switchMap(([name, id]) => (id ? this.resources.getPoolById(+id) : this.resources.getPoolByName(name))),
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
