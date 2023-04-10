import {
  Component, EventEmitter, Input, Output,
} from '@angular/core';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { ChartScaleQueryParams, ChartScaleResult } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { Job } from 'app/interfaces/job.interface';
import { AppStatus } from 'app/pages/apps/enum/app-status.enum';

@Component({
  selector: 'ix-app-row',
  templateUrl: './app-row.component.html',
  styleUrls: ['./app-row.component.scss'],
})
export class AppRowComponent {
  @Input() app: ChartRelease;
  @Input() job?: Job<ChartScaleResult, ChartScaleQueryParams>;
  @Output() startApp = new EventEmitter<void>();
  @Output() stopApp = new EventEmitter<void>();
  @Output() clickStatus = new EventEmitter<void>();
  inProgress = false;

  readonly imagePlaceholder = appImagePlaceholder;

  get hasUpdates(): boolean {
    return this.app.update_available || this.app.container_images_update_available;
  }

  get isAppStopped(): boolean {
    return this.app.status === ChartReleaseStatus.Stopped;
  }

  toggleAppChecked(checked: boolean): void {
    this.app.selected = checked;
  }

  start(): void {
    this.startApp.emit();
  }

  stop(): void {
    this.stopApp.emit();
  }

  statusChanged(status: AppStatus): void {
    this.inProgress = [
      AppStatus.Deploying,
      AppStatus.Starting,
      AppStatus.Stopping,
    ].includes(status);
  }

  statusPressed(): void {
    this.clickStatus.emit();
  }
}
