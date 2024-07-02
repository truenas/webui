import {
  ChangeDetectionStrategy,
  Component, HostBinding,
  computed,
  input,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ChartScaleQueryParams, ChartScaleResult } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { Job } from 'app/interfaces/job.interface';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { appStatusIcons, appStatusLabels } from 'app/pages/apps/enum/app-status.enum';
import { getAppStatus } from 'app/pages/apps/utils/get-app-status';

@Component({
  selector: 'ix-app-status-cell',
  templateUrl: './app-status-cell.component.html',
  styleUrls: ['./app-status-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslateModule, MapValuePipe, MatTooltipModule, IxIconModule],
})
export class AppStatusCellComponent {
  app = input.required<ChartRelease>();
  job = input<Job<ChartScaleResult, ChartScaleQueryParams>>();
  showIcon = input<boolean>(false);

  @HostBinding('class') get hostClasses(): string[] {
    return [
      'status',
      this.status()?.toLowerCase(),
      this.showIcon() ? 'has-icon' : 'has-cell',
    ];
  }

  status = computed(() => {
    const app = this.app();
    const job = this.job();

    return getAppStatus(app, job);
  });

  protected appStatusIcons = appStatusIcons;
  protected appStatusLabels = appStatusLabels;
}
