import {
  ChangeDetectionStrategy,
  Component, computed, input, output,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AppState } from 'app/enums/app-state.enum';
import { Role } from 'app/enums/role.enum';
import { App, AppStartQueryParams, AppStats } from 'app/interfaces/app.interface';
import { Job } from 'app/interfaces/job.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppStateCellComponent } from 'app/pages/apps/components/installed-apps/app-state-cell/app-state-cell.component';
import { AppUpdateCellComponent } from 'app/pages/apps/components/installed-apps/app-update-cell/app-update-cell.component';
import { isExternalApp } from 'app/pages/apps/utils/app-type.utils';

@Component({
  selector: 'ix-app-row',
  templateUrl: './app-row.component.html',
  styleUrls: ['./app-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCheckbox,
    TestDirective,
    ImgFallbackModule,
    AppStateCellComponent,
    TranslateModule,
    MatTooltip,
    NetworkSpeedPipe,
    FileSizePipe,
    AppUpdateCellComponent,
    RequiresRolesDirective,
    MatIconButton,
    IxIconComponent,
  ],
})
export class AppRowComponent {
  readonly app = input.required<App>();
  readonly stats = input<AppStats | null>();
  readonly selected = input.required<boolean>();
  readonly job = input<Job<void, AppStartQueryParams>>();

  readonly startApp = output();
  readonly stopApp = output();
  readonly restartApp = output();
  readonly clickStatus = output();
  readonly selectionChange = output();

  protected readonly imagePlaceholder = appImagePlaceholder;
  protected readonly requiredRoles = [Role.AppsWrite];

  readonly isAppStopped = computed(() => {
    return this.app().state === AppState.Stopped || this.app().state === AppState.Crashed;
  });

  readonly hasStats = computed(() => {
    return this.app().state === AppState.Running && this.stats();
  });

  readonly inProgress = computed(() => {
    return [AppState.Deploying].includes(this.app().state);
  });

  readonly isExternalApp = computed(() => {
    return isExternalApp(this.app());
  });

  readonly trafficStats = computed(() => {
    const networks = this.stats()?.networks;
    if (!networks?.length) return { incoming: 0, outgoing: 0 };

    return networks.reduce((acc, stats) => ({
      incoming: acc.incoming + (stats.rx_bytes || 0) * 8,
      outgoing: acc.outgoing + (stats.tx_bytes || 0) * 8,
    }), { incoming: 0, outgoing: 0 });
  });

  readonly incomingTrafficBits = computed(() => this.trafficStats().incoming);
  readonly outgoingTrafficBits = computed(() => this.trafficStats().outgoing);

  toggleAppChecked(): void {
    // Defensive check: External apps don't render checkboxes in the template,
    // but this prevents selection changes if called programmatically
    if (!isExternalApp(this.app())) {
      this.selectionChange.emit();
    }
  }

  start(): void {
    this.startApp.emit();
  }

  stop(): void {
    this.stopApp.emit();
  }

  restart(): void {
    this.restartApp.emit();
  }

  statusPressed(): void {
    this.clickStatus.emit();
  }
}
