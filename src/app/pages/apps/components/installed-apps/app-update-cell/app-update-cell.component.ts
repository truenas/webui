import { ChangeDetectionStrategy, Component, HostBinding, computed, input, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent, TnTooltipDirective } from '@truenas/ui-components';
import { App } from 'app/interfaces/app.interface';
import { analyzeVersionChange } from 'app/pages/apps/utils/version-comparison.utils';
import { resolveAppVersion } from 'app/pages/apps/utils/version-formatting.utils';

@Component({
  selector: 'ix-app-update-cell',
  templateUrl: './app-update-cell.component.html',
  styleUrls: ['./app-update-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, TnIconComponent, TnTooltipDirective],
})
export class AppUpdateCellComponent {
  private translate = inject(TranslateService);

  app = input.required<App>();
  showIcon = input<boolean>(false);
  hasUpdate = computed(() => this.app()?.upgrade_available);

  protected versionChange = computed(() => analyzeVersionChange(this.app()));

  /**
   * Multi-line tooltip listing what the update actually changes.
   * Targets come from the latest_* fields, never from the currently installed
   * human_version, which would render the update as a no-op.
   */
  protected updateTooltip = computed(() => {
    const app = this.app();
    const lines = [this.getUpdateMessage()];

    if (this.versionChange().hasAppVersionChange && app.latest_app_version) {
      const currentAppVersion = resolveAppVersion({
        appVersion: app.metadata?.app_version,
        humanVersion: app.human_version,
        libraryVersion: app.version,
      });
      lines.push(`${this.translate.instant('Version')}: ${currentAppVersion} → ${app.latest_app_version}`);
    }

    if (this.versionChange().hasRevisionChange) {
      lines.push(`${this.translate.instant('Revision')}: ${app.version} → ${app.latest_version}`);
    }

    return lines.join('\n');
  });

  @HostBinding('class') get hostClasses(): string[] {
    return ['update', this.showIcon() ? 'has-icon' : 'has-cell'];
  }

  protected getUpdateMessage(): string {
    const change = this.versionChange();
    if (change.hasAppVersionChange) {
      return this.translate.instant('Update available');
    }
    return this.translate.instant('Revision available');
  }
}
