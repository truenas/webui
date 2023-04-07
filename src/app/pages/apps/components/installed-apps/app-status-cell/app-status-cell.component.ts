import { Component, HostBinding, Input } from '@angular/core';
import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { AppStatus, appStatusLabels } from 'app/pages/apps/enum/app-status.enum';

@Component({
  selector: 'ix-app-status-cell',
  templateUrl: './app-status-cell.component.html',
  styleUrls: ['./app-status-cell.component.scss'],
})
export class AppStatusCellComponent {
  @Input() app: ChartRelease;
  @HostBinding('class') get hostClasses(): string[] {
    return ['status', this.appStatus.toLowerCase()];
  }

  protected appStatusLabels = appStatusLabels;

  get appStatus(): AppStatus {
    let status: AppStatus;

    switch (this.app.status) {
      case ChartReleaseStatus.Active:
        status = AppStatus.Started;
        break;
      case ChartReleaseStatus.Deploying:
        status = AppStatus.Deploying;
        break;
      case ChartReleaseStatus.Stopped:
        status = AppStatus.Stopped;
        break;
      default:
        console.info('Unknown app status');
    }

    return status;
  }
}
