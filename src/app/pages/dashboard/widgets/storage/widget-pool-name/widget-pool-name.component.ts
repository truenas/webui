import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { map } from 'rxjs';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import {
  SlotSize,
} from 'app/pages/dashboard/types/widget.interface';
import { WidgetPoolNameSettings, poolNameWidget } from 'app/pages/dashboard/widgets/storage/widget-pool-name/widget-pool-name.definition';

@Component({
  selector: 'ix-widget-pool-name',
  templateUrl: './widget-pool-name.component.html',
  styleUrls: ['./widget-pool-name.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetPoolNameComponent implements WidgetComponent {
  size = input.required<SlotSize>();
  settings = input.required<WidgetPoolNameSettings>();

  protected poolName = computed(() => {
    return this.resources.getPoolById(+this.settings().poolId).pipe(
      map((pool) => pool.name),
      toLoadingState(),
    );
  });

  readonly name = poolNameWidget.name;

  constructor(
    private resources: WidgetResourcesService,
  ) {}
}
