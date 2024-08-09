import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';

@UntilDestroy()
@Component({
  selector: 'ix-apps-scope-wrapper',
  template: '<router-outlet></router-outlet>',
  providers: [
    AppsFilterStore,
    InstalledAppsStore,
    DockerStore,
    AppsStore,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppsScopeWrapperComponent implements OnDestroy {
  constructor(
    private appsFilterStore: AppsFilterStore,
    private dockerService: DockerStore,
  ) {
    this.dockerService.initialize();
    this.dockerService.dockerStatusEventUpdates().pipe(
      untilDestroyed(this),
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.appsFilterStore.resetFilters();
  }
}
