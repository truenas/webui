import {
  ChangeDetectionStrategy,
  Component, HostBinding, Input,
} from '@angular/core';
import { ChartScaleQueryParams, ChartScaleResult } from 'app/interfaces/chart-release-event.interface';
import { Job } from 'app/interfaces/job.interface';
import { AppStatus, appStatusLabels } from 'app/pages/apps/enum/app-status.enum';

@Component({
  selector: 'ix-app-status-cell',
  templateUrl: './app-status-cell.component.html',
  styleUrls: ['./app-status-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppStatusCellComponent {
  @Input() appStatus: AppStatus;
  @Input() inProgress: boolean;
  @Input() job: Job<ChartScaleResult, ChartScaleQueryParams>;
  @HostBinding('class') get hostClasses(): string[] {
    return ['status', this.appStatus?.toLowerCase()];
  }

  protected appStatusLabels = appStatusLabels;
}
