import {
  ChangeDetectionStrategy, Component, inject, input,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnTestIdDirective, TnTooltipDirective } from '@truenas/ui-components';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';

@Component({
  selector: 'ix-installed-app-badge',
  styleUrls: ['./installed-app-badge.component.scss'],
  templateUrl: './installed-app-badge.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    TnTestIdDirective,
    TnTooltipDirective,
  ],
})
export class InstalledAppBadgeComponent {
  private installedAppsStore = inject(InstalledAppsStore);
  private router = inject(Router);

  readonly app = input.required<AvailableApp>();

  navigateToAllInstalledPage(event?: Event): void {
    event?.preventDefault();

    const installedApp = this.installedAppsStore.installedApps().find((app) => {
      return app.name === this.app().name && app.metadata.train === this.app().train;
    });

    if (installedApp) {
      this.router.navigate(['/apps', 'installed', installedApp.metadata.train, installedApp.name]);
    } else {
      this.router.navigate(['/apps', 'installed']);
    }
  }
}
