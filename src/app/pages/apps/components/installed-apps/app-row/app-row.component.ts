import {
  ChangeDetectionStrategy,
  Component, computed, input, output,
} from '@angular/core';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { AppState } from 'app/enums/app-state.enum';
import { Role } from 'app/enums/role.enum';
import { App, AppStartQueryParams } from 'app/interfaces/app.interface';
import { Job } from 'app/interfaces/job.interface';

@Component({
  selector: 'ix-app-row',
  templateUrl: './app-row.component.html',
  styleUrls: ['./app-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppRowComponent {
  readonly app = input.required<App>();
  readonly selected = input.required<boolean>();
  readonly job = input<Job<void, AppStartQueryParams>>();

  readonly startApp = output();
  readonly stopApp = output();
  readonly clickStatus = output();
  readonly selectionChange = output();

  protected readonly imagePlaceholder = appImagePlaceholder;
  protected readonly requiredRoles = [Role.AppsWrite];

  readonly hasUpdates = computed(() => {
    return this.app().upgrade_available;
  });

  readonly isAppStopped = computed(() => this.app().state === AppState.Stopped);

  readonly inProgress = computed(() => {
    return [AppState.Deploying].includes(this.app().state) || this.isStartingOrStopping();
  });

  readonly isStartingOrStopping = computed(() => {
    return [AppState.Deploying, AppState.Stopping].includes(this.app().state);
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
