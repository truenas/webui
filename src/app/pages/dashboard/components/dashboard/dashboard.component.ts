import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { DashboardStore } from 'app/pages/dashboard/services/dashboard.store';
import { WidgetGroup } from 'app/pages/dashboard/types/widget-group.interface';

@Component({
  selector: 'ix-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  // TODO: Use similar approach to loading as we have on Datasets
  // TODO: If old data is available, show it while loading new data.
  // TODO: Prevent user from entering configuration mode while loading.
  readonly state$ = this.dashboardStore.state$;

  constructor(
    private dashboardStore: DashboardStore,
  ) {}

  ngOnInit(): void {
    this.dashboardStore.entered();
  }

  protected onConfigure(): void {
    // TODO: Enter configuration mode. Probably store layout that is being edited locally or in a new service.
  }

  protected onCancelConfigure(): void {

  }

  protected onSave(): void {
    const newSettings = [] as WidgetGroup[];
    this.dashboardStore.save(newSettings);
  }
}
