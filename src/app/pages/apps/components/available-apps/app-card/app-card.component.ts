import {
  ChangeDetectionStrategy, Component, computed,
  input,
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';
import { InstalledAppBadgeComponent } from 'app/pages/apps/components/installed-app-badge/installed-app-badge.component';

@UntilDestroy()
@Component({
  selector: 'ix-app-card',
  templateUrl: './app-card.component.html',
  styleUrls: ['./app-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    AppCardLogoComponent,
    InstalledAppBadgeComponent,
    TnIconComponent,
    MatTooltip,
  ],
})
export class AppCardComponent {
  readonly app = input.required<AvailableApp>();

  protected readonly description = computed(() => {
    const description = this.app().description || '';
    return description.length > 150 ? `${description.substring(0, 150)}...` : description;
  });

  protected readonly versionTooltip = computed(() => {
    const appVersion = this.app().latest_app_version || 'N/A';
    const catalogVersion = this.app().latest_version || 'N/A';
    return `Upstream Application Version: ${appVersion}\nTrueNAS Catalog Version: ${catalogVersion}`;
  });
}
