import {
  ChangeDetectionStrategy,
  Component, HostBinding,
  computed,
  input,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { App } from 'app/interfaces/app.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AppVersionPipe } from 'app/pages/dashboard/widgets/apps/common/utils/app-version.pipe';

@Component({
  selector: 'ix-app-update-cell',
  templateUrl: './app-update-cell.component.html',
  styleUrls: ['./app-update-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslateModule, MatTooltipModule, IxIconComponent, AppVersionPipe],
})
export class AppUpdateCellComponent {
  app = input.required<App>();
  showIcon = input<boolean>(false);
  hasUpdate = computed(() => this.app()?.upgrade_available);

  @HostBinding('class') get hostClasses(): string[] {
    return ['update', this.showIcon() ? 'has-icon' : 'has-cell'];
  }
}
