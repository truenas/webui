import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs';
import { officialCatalog } from 'app/constants/catalog.constants';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-card',
  templateUrl: './app-card.component.html',
  styleUrls: ['./app-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppCardComponent {
  @Input() app: AvailableApp;

  readonly officialCatalog = officialCatalog;

  get description(): string {
    return this.app.description.length > 150 ? `${this.app.description.substring(0, 150)}...` : this.app.description;
  }

  constructor(
    private router: Router,
    private installedAppsStore: InstalledAppsStore,
  ) {}

  navigateToAllInstalledPage(): void {
    this.installedAppsStore.installedApps$.pipe(
      map((apps) => apps.filter((app) => (app.chart_metadata.name === this.app.name
        && app.catalog === this.app.catalog && app.catalog_train === this.app.train))),
      untilDestroyed(this),
    ).subscribe((apps) => {
      if (apps.length) {
        this.router.navigate(['/apps', 'installed', apps[0].name]);
      } else {
        this.router.navigate(['/apps', 'installed']);
      }
    });
  }
}
