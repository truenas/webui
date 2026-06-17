import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnCardComponent, TnDialog, TnIconButtonComponent, TnTooltipDirective } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AppState } from 'app/enums/app-state.enum';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import {
  App, AppContainerDetails, appContainerStateLabels,
} from 'app/interfaces/app.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import {
  VolumeMountsDialog,
} from 'app/pages/apps/components/installed-apps/app-workloads-card/volume-mounts-dialog/volume-mounts-dialog.component';

@Component({
  selector: 'ix-app-containers-card',
  templateUrl: './app-workloads-card.component.html',
  styleUrls: ['./app-workloads-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TranslateModule,
    TnTooltipDirective,
    RequiresRolesDirective,
    MapValuePipe,
    TnIconButtonComponent,
    DecimalPipe,
    TooltipComponent,
  ],
})
export class AppWorkloadsCardComponent {
  private tnDialog = inject(TnDialog);
  private router = inject(Router);

  readonly app = input.required<App>();

  readonly AppState = AppState;

  protected readonly requiredRoles = [Role.AppsWrite];
  protected readonly appContainerStateLabels = appContainerStateLabels;
  protected readonly helptext = helptextApps;

  protected readonly hostPorts = computed(() => {
    const hostPorts: { hostIp: string; hostPort: string; containerPort: string; protocol: string }[] = [];

    this.app().active_workloads.used_ports.forEach((port) => {
      port.host_ports?.forEach((hostPort) => {
        hostPorts.push({
          hostIp: hostPort.host_ip,
          hostPort: hostPort.host_port,
          containerPort: port.container_port,
          protocol: port.protocol,
        });
      });
    });

    return hostPorts;
  });

  volumeButtonPressed(containerDetails: AppContainerDetails): void {
    this.tnDialog.open(VolumeMountsDialog, {
      minWidth: '60vw',
      data: containerDetails,
    });
  }

  getViewLogsLink(containerDetails: AppContainerDetails): string[] {
    return [
      '/apps',
      'installed',
      this.app().metadata.train,
      this.app().name,
      'logs',
      containerDetails.id,
    ];
  }

  getShellLink(containerDetails: AppContainerDetails): string[] {
    return [
      '/apps',
      'installed',
      this.app().metadata.train,
      this.app().name,
      'shell',
      containerDetails.id,
    ];
  }

  // tn-icon-button renders as a button, not an anchor, so the shell/logs shortcuts
  // can't use [routerLink] — route programmatically instead of from the template.
  protected goTo(commands: string[]): void {
    this.router.navigate(commands);
  }
}
