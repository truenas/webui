import {
  ChangeDetectionStrategy,
  Component, HostBinding,
  input,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ChartScaleQueryParams, ChartScaleResult } from 'app/interfaces/chart-release-event.interface';
import { Job } from 'app/interfaces/job.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { AppStatus, appStatusLabels } from 'app/pages/apps/enum/app-status.enum';

@Component({
  selector: 'ix-app-status-cell',
  templateUrl: './app-status-cell.component.html',
  styleUrls: ['./app-status-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslateModule, MapValuePipe, MatTooltipModule],
})
export class AppStatusCellComponent {
  appStatus = input.required<AppStatus>();
  inProgress = input<boolean>();
  job = input<Job<ChartScaleResult, ChartScaleQueryParams>>();

  @HostBinding('class') get hostClasses(): string[] {
    return ['status', this.appStatus()?.toLowerCase()];
  }

  protected appStatusLabels = appStatusLabels;
}
