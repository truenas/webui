import { Component, OnDestroy } from '@angular/core';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStatisticsService } from 'app/pages/apps/store/apps-statistics.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { KubernetesStore } from 'app/pages/apps/store/kubernetes-store.service';

@Component({
  template: '<router-outlet></router-outlet>',
  providers: [
    AppsFilterStore,
    InstalledAppsStore,
    AppsStatisticsService,
    KubernetesStore,
    AppsStore,
  ],
})
export class AppsScopeWrapperComponent implements OnDestroy {
  constructor(private appsFilterStore: AppsFilterStore) {
  }

  ngOnDestroy(): void {
    this.appsFilterStore.resetFilters();
  }
}
