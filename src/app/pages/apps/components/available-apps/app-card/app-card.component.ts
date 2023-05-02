import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs';
import { officialCatalog } from 'app/constants/catalog.constants';
import { AvailableApp } from 'app/interfaces/available-app.interfase';
import { AvailableAppsStore } from 'app/pages/apps/store/available-apps-store.service';

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
    // TODO: This temporarily uses incorrect field. This is supposed to be a short description with no html tags.
    const description = this.app.app_readme.replace(/<[^>]*>/g, '');
    return description.length > 150 ? `${description.substring(0, 150)}...` : description;
  }

  constructor(
    private applicationsStore: AvailableAppsStore,
    private router: Router,
  ) {}

  navigateToAllInstalledPage(): void {
    this.applicationsStore.installedApps$.pipe(
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
