import {
  ChangeDetectionStrategy,
  Component, HostBinding,
  computed,
  input,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { App } from 'app/interfaces/chart-release.interface';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

@Component({
  selector: 'ix-app-update-cell',
  templateUrl: './app-update-cell.component.html',
  styleUrls: ['./app-update-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslateModule, MapValuePipe, MatTooltipModule, IxIconModule],
})
export class AppUpdateCellComponent {
  app = input.required<App>();
  showIcon = input<boolean>(false);

  @HostBinding('class') get hostClasses(): string[] {
    return ['update', this.showIcon() ? 'has-icon' : 'has-cell'];
  }

  hasUpdate = computed(() => {
    const app = this.app();

    return app.upgrade_available || app.container_images_update_available;
  });
}
