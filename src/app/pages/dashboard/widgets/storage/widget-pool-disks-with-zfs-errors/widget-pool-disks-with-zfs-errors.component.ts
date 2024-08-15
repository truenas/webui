import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { filter, switchMap, tap } from 'rxjs';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetPoolSettings } from 'app/pages/dashboard/widgets/storage/widget-pool/widget-pool.definition';
import { poolDisksWithZfsErrorsWidget } from 'app/pages/dashboard/widgets/storage/widget-pool-disks-with-zfs-errors/widget-pool-disks-with-zfs-errors.definition';

@Component({
  selector: 'ix-widget-pool-disks-with-zfs-errors',
  templateUrl: './widget-pool-disks-with-zfs-errors.component.html',
  styleUrls: ['./widget-pool-disks-with-zfs-errors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetDisksWithZfsErrorsComponent implements WidgetComponent {
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

  readonly name = poolDisksWithZfsErrorsWidget.name;

  constructor(
    private resources: WidgetResourcesService,
    private cdr: ChangeDetectorRef,
  ) {}
}
