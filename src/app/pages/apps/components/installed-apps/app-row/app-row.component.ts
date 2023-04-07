import {
  Component, EventEmitter, Input, Output,
} from '@angular/core';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { ChartRelease } from 'app/interfaces/chart-release.interface';

@Component({
  selector: 'ix-app-row',
  templateUrl: './app-row.component.html',
  styleUrls: ['./app-row.component.scss'],
})
export class AppRowComponent {
  @Input() app: ChartRelease;
  @Output() startApp = new EventEmitter<void>();
  @Output() stopApp = new EventEmitter<void>();

  readonly imagePlaceholder = appImagePlaceholder;
  readonly appStatus = ChartReleaseStatus;

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
}
