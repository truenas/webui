import { ChangeDetectionStrategy, Component, HostBinding, computed, input, inject } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { App } from 'app/interfaces/app.interface';

@Component({
  selector: 'ix-app-update-cell',
  templateUrl: './app-update-cell.component.html',
  styleUrls: ['./app-update-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, MatTooltipModule, TnIconComponent],
})
export class AppUpdateCellComponent {
  private translate = inject(TranslateService);

  app = input.required<App>();
  showIcon = input<boolean>(false);
  hasUpdate = computed(() => this.app()?.upgrade_available);

  @HostBinding('class') get hostClasses(): string[] {
    return ['update', this.showIcon() ? 'has-icon' : 'has-cell'];
  }

  protected getVersionMsg(): string {
    const app = this.app();
    const catalogVersion = `${app.version} → ${app.latest_version}`;
    const appVersion = `${app.metadata.app_version} → ${app.human_version}`;

    // Using line breaks for tooltip - Angular Material tooltips support this
    const updateAvailable = this.translate.instant('Update available');
    const version = this.translate.instant('Version');
    const appVersionLabel = this.translate.instant('App Version');

    return `${updateAvailable}\n${appVersionLabel}: ${appVersion}\n${version}: ${catalogVersion}`;
  }
}
