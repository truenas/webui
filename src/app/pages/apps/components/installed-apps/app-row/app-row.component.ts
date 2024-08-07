import {
  ChangeDetectionStrategy,
  Component, EventEmitter, Input, Output,
} from '@angular/core';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { Role } from 'app/enums/role.enum';
import { AppStartQueryParams } from 'app/interfaces/chart-release-event.interface';
import { App } from 'app/interfaces/chart-release.interface';
import { Job } from 'app/interfaces/job.interface';
import { AppStatus } from 'app/pages/apps/enum/app-status.enum';

@Component({
  selector: 'ix-app-row',
  templateUrl: './app-row.component.html',
  styleUrls: ['./app-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppRowComponent {
  @Input() app: App;
  @Input() status: AppStatus;
  @Input() selected: boolean;
  @Input() job?: Job<void, AppStartQueryParams>;
  @Output() startApp = new EventEmitter<void>();
  @Output() stopApp = new EventEmitter<void>();
  @Output() clickStatus = new EventEmitter<void>();
  @Output() selectionChange = new EventEmitter<void>();

  readonly imagePlaceholder = appImagePlaceholder;

  protected readonly requiredRoles = [Role.AppsWrite];

  get hasUpdates(): boolean {
    return this.app.upgrade_available || this.app.container_images_update_available;
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

  toggleAppChecked(): void {
    this.selectionChange.emit();
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
