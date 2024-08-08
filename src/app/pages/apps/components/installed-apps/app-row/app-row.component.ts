import {
  ChangeDetectionStrategy,
  Component, computed, input, output,
} from '@angular/core';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { Role } from 'app/enums/role.enum';
import { App, AppStartQueryParams } from 'app/interfaces/app.interface';
import { Job } from 'app/interfaces/job.interface';
import { AppStatus } from 'app/pages/apps/enum/app-status.enum';

@Component({
  selector: 'ix-app-row',
  templateUrl: './app-row.component.html',
  styleUrls: ['./app-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppRowComponent {
  readonly app = input.required<App>();
  readonly status = input.required<AppStatus>();
  readonly selected = input.required<boolean>();
  readonly job = input<Job<void, AppStartQueryParams>>();

  readonly startApp = output();
  readonly stopApp = output();
  readonly clickStatus = output();
  readonly selectionChange = output();

  protected readonly imagePlaceholder = appImagePlaceholder;
  protected readonly requiredRoles = [Role.AppsWrite];

  readonly hasUpdates = computed(() => {
    return this.app().upgrade_available || this.app().container_images_update_available;
  });

  readonly isAppStopped = computed(() => this.status() === AppStatus.Started);

  readonly inProgress = computed(() => {
    return [AppStatus.Deploying].includes(this.status()) || this.isStartingOrStopping();
  });

  readonly isStartingOrStopping = computed(() => {
    return [AppStatus.Starting, AppStatus.Stopping].includes(this.status());
  });

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
