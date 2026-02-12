import { ChangeDetectionStrategy, Component, HostBinding, computed, input, inject } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent, TnTooltipDirective } from '@truenas/ui-components';
import { App } from 'app/interfaces/app.interface';
import { analyzeVersionChange } from 'app/pages/apps/utils/version-comparison.utils';

@Component({
  selector: 'ix-app-update-cell',
  templateUrl: './app-update-cell.component.html',
  styleUrls: ['./app-update-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, MatTooltipModule, TnIconComponent, TnTooltipDirective],
})
export class AppUpdateCellComponent {
  private translate = inject(TranslateService);

  app = input.required<App>();
  showIcon = input<boolean>(false);
  hasUpdate = computed(() => this.app()?.upgrade_available);

  protected versionChange = computed(() => analyzeVersionChange(this.app()));

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
