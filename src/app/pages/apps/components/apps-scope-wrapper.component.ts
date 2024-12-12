import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStatsService } from 'app/pages/apps/store/apps-stats.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
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
    AppsStatsService,
  ],
  standalone: true,
  imports: [
    RouterOutlet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppsScopeWrapperComponent implements OnDestroy {
  constructor(
    private appsFilterStore: AppsFilterStore,
    private dockerService: DockerStore,
  ) {
    this.dockerService.initialize();
    this.dockerService.dockerStatusEventUpdates().pipe(untilDestroyed(this)).subscribe();
    this.dockerService.dockerConfigEventUpdates().pipe(untilDestroyed(this)).subscribe();
  }

  ngOnDestroy(): void {
    this.appsFilterStore.resetFilters();
  }
}
