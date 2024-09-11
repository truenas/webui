import {
  ChangeDetectionStrategy,
  Component, computed, input, output,
} from '@angular/core';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { AppState } from 'app/enums/app-state.enum';
import { Role } from 'app/enums/role.enum';
import { App, AppStartQueryParams, AppStats } from 'app/interfaces/app.interface';
import { Job } from 'app/interfaces/job.interface';

@Component({
  selector: 'ix-app-row',
  templateUrl: './app-row.component.html',
  styleUrls: ['./app-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppRowComponent {
  readonly app = input.required<App>();
  readonly stats = input.required<AppStats>();
  readonly selected = input.required<boolean>();
  readonly job = input<Job<void, AppStartQueryParams>>();

  readonly startApp = output();
  readonly stopApp = output();
  readonly clickStatus = output();
  readonly selectionChange = output();

  protected readonly imagePlaceholder = appImagePlaceholder;
  protected readonly requiredRoles = [Role.AppsWrite];

  readonly hasUpdates = computed(() => this.app().upgrade_available);
  readonly isAppStopped = computed(() => this.app().state === AppState.Stopped);
  readonly hasStats = computed(() => {
    return this.app().state === AppState.Running && this.stats();
  });

  readonly inProgress = computed(() => {
    return [AppState.Deploying].includes(this.app().state);
  });

  readonly incomingTraffic = computed(() => {
    return this.stats().networks.reduce((sum, stats) => sum + stats.rx_bytes, 0);
  });

  readonly outgoingTraffic = computed(() => {
    return this.stats().networks.reduce((sum, stats) => sum + stats.tx_bytes, 0);
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
