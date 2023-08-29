import {
  ChangeDetectionStrategy,
  Component, EventEmitter, Input, Output,
} from '@angular/core';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { ChartScaleQueryParams, ChartScaleResult } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { Job } from 'app/interfaces/job.interface';
import { AppStatus } from 'app/pages/apps/enum/app-status.enum';

@Component({
  selector: 'ix-app-row',
  templateUrl: './app-row.component.html',
  styleUrls: ['./app-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppRowComponent {
  @Input() app: ChartRelease;
  @Input() status: AppStatus;
  @Input() selected: boolean;
  @Input() job?: Job<ChartScaleResult, ChartScaleQueryParams>;
  @Output() startApp = new EventEmitter<void>();
  @Output() stopApp = new EventEmitter<void>();
  @Output() clickStatus = new EventEmitter<void>();

  readonly imagePlaceholder = appImagePlaceholder;

  get hasUpdates(): boolean {
    return this.app.update_available || this.app.container_images_update_available;
  }

  get isAppStopped(): boolean {
    return this.status === AppStatus.Stopped;
  }

  get inProgress(): boolean {
    return [AppStatus.Deploying].includes(this.status) || this.isStartingOrStopping;
  }

  get isStartingOrStopping(): boolean {
    return [AppStatus.Starting, AppStatus.Stopping].includes(this.status);
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

  statusPressed(): void {
    this.clickStatus.emit();
  }
}
