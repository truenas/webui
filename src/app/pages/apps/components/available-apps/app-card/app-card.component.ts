import {
  ChangeDetectionStrategy, Component, computed,
  inject,
  input,
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
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
    IxIconComponent,
    MatTooltip,
  ],
})
export class AppCardComponent {
  private translate = inject(TranslateService);

  readonly app = input.required<AvailableApp>();

  protected readonly description = computed(() => {
    const description = this.app().description || '';
    return description.length > 150 ? `${description.substring(0, 150)}...` : description;
  });

  protected readonly versionTooltip = computed(() => {
    const version = this.app().latest_app_version || 'N/A';
    const revision = this.app().latest_version || 'N/A';
    return `${this.translate.instant('Upstream Application Version')}: ${version}\n${this.translate.instant('TrueNAS Catalog Revision')}: ${revision}`;
  });
}
