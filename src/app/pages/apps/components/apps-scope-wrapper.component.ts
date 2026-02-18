import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, OnDestroy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStatsService } from 'app/pages/apps/store/apps-stats.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';

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
  imports: [
    RouterOutlet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppsScopeWrapperComponent implements OnDestroy {
  private appsFilterStore = inject(AppsFilterStore);
  private dockerService = inject(DockerStore);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.dockerService.initialize();
    this.dockerService.dockerStatusEventUpdates().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.dockerService.dockerConfigEventUpdates().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  ngOnDestroy(): void {
    this.appsFilterStore.resetFilters();
  }
}
