import {
  Component, EventEmitter, Input, Output,
} from '@angular/core';
import { filter, map } from 'rxjs';
import { DashboardStorageStore } from 'app/pages/dashboard/store/dashboard-storage-store.service';
import { deepCloneState } from 'app/pages/dashboard/utils/deep-clone-state.helper';

@Component({
  selector: 'ix-widget-pool-wrapper',
  templateUrl: './widget-pool-wrapper.component.html',
})
export class WidgetPoolWrapperComponent {
  @Input() pool: string;

  @Input() showReorderHandle = false;
  @Output() back = new EventEmitter<void>();

  protected poolState$ = this.dashboardStorageStore$.pools$.pipe(
    filter((pools) => !!pools?.length),
    deepCloneState(),
    map((pools) => pools.find((pool) => pool.name === this.pool)),
  );
  protected volumeData$ = this.dashboardStorageStore$.volumesData$.pipe(
    filter((volumesData) => !!volumesData && !!Object.keys(volumesData).length),
    deepCloneState(),
    map((vd) => vd[this.pool]),
  );

  protected isLoading$ = this.dashboardStorageStore$.isLoading$;

  constructor(private dashboardStorageStore$: DashboardStorageStore) { }

  onMobileBack(): void {
    this.back.emit();
  }
}
