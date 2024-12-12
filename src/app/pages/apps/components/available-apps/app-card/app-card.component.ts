import {
  ChangeDetectionStrategy, Component, computed,
  input,
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-card',
  templateUrl: './app-card.component.html',
  styleUrls: ['./app-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslateModule,
    MatTooltip,
    TestDirective,
    AppCardLogoComponent,
  ],
})
export class AppCardComponent {
  readonly app = input.required<AvailableApp>();

  protected readonly description = computed(() => {
    const description = this.app().description || '';
    return description.length > 150 ? `${description.substring(0, 150)}...` : description;
  });

  constructor(
    private router: Router,
    private installedAppsStore: InstalledAppsStore,
  ) {}

  navigateToAllInstalledPage(): void {
    this.installedAppsStore.installedApps$.pipe(
      map((apps) => {
        return apps.filter((app) => app.metadata.name === this.app().name && app.metadata.train === this.app().train);
      }),
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
