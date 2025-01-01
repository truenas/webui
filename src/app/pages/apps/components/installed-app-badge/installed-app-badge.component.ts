import {
  ChangeDetectionStrategy, Component,
  input,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';

@UntilDestroy()
@Component({
  selector: 'ix-installed-app-badge',
  styleUrls: ['./installed-app-badge.component.scss'],
  templateUrl: './installed-app-badge.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslateModule,
    TestDirective,
    MatTooltipModule,
  ],
})
export class InstalledAppBadgeComponent {
  readonly app = input.required<AvailableApp>();

  constructor(
    private installedAppsStore: InstalledAppsStore,
    private router: Router,
  ) {}

  navigateToAllInstalledPage(event?: Event): void {
    event?.preventDefault();

    this.installedAppsStore.installedApps$.pipe(
      map((apps) => {
        return apps.filter((app) => {
          return app.name === this.app().name
            && app.metadata.train === this.app().train;
        });
      }),
      untilDestroyed(this),
    ).subscribe({
      next: (apps) => {
        if (apps.length) {
          this.router.navigate(['/apps', 'installed', apps[0].metadata.train, apps[0].name]);
        } else {
          this.router.navigate(['/apps', 'installed']);
        }
      },
    });
  }
}
