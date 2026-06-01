import { DecimalPipe } from '@angular/common';
import { TnDialog, TnIconComponent } from '@truenas/ui-components';
import { ChangeDetectionStrategy, Component, input, computed, inject } from '@angular/core';
import { MatIconAnchor, MatIconButton } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AppState } from 'app/enums/app-state.enum';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import {
  App, AppContainerDetails, appContainerStateLabels,
} from 'app/interfaces/app.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
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
    MatCard,
    MatCardHeader,
    MatCardTitle,
    TranslateModule,
    MatTooltip,
    RequiresRolesDirective,
    TestDirective,
    TnIconComponent,
    MapValuePipe,
    MatIconButton,
    MatCardContent,
    DecimalPipe,
    TooltipComponent,
    RouterLink,
    MatIconAnchor,
  ],
})
export class AppWorkloadsCardComponent {
  private tnDialog = inject(TnDialog);

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
}
