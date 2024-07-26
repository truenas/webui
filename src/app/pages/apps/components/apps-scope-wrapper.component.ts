import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStatisticsService } from 'app/pages/apps/store/apps-statistics.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';

@Component({
  selector: 'ix-apps-scope-wrapper',
  template: '<router-outlet></router-outlet>',
  providers: [
    AppsFilterStore,
    InstalledAppsStore,
    AppsStatisticsService,
    DockerStore,
    AppsStore,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppsScopeWrapperComponent implements OnDestroy {
  constructor(private appsFilterStore: AppsFilterStore) {
  }

  ngOnDestroy(): void {
    this.appsFilterStore.resetFilters();
  }
}
