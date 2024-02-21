import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { KubernetesStore } from 'app/pages/apps/store/kubernetes-store.service';

@Component({
  template: '<router-outlet></router-outlet>',
  providers: [
    AppsFilterStore,
    InstalledAppsStore,
    KubernetesStore,
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
