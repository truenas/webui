import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input, computed,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AppState } from 'app/enums/app-state.enum';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import {
  App, AppContainerDetails, appContainerStateLabels,
} from 'app/interfaces/app.interface';
import { ShellDetailsDialogFormValue } from 'app/interfaces/shell-details-dialog.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import {
  VolumeMountsDialogComponent,
} from 'app/pages/apps/components/installed-apps/app-workloads-card/volume-mounts-dialog/volume-mounts-dialog.component';
import { ShellDetailsDialogComponent } from 'app/pages/apps/components/shell-details-dialog/shell-details-dialog.component';
import { ShellDetailsType } from 'app/pages/apps/enum/shell-details-type.enum';

@UntilDestroy()
@Component({
  selector: 'ix-app-containers-card',
  templateUrl: './app-workloads-card.component.html',
  styleUrls: ['./app-workloads-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    TranslateModule,
    MatTooltip,
    RequiresRolesDirective,
    TestDirective,
    IxIconComponent,
    MapValuePipe,
    MatIconButton,
    MatCardContent,
    DecimalPipe,
    TooltipComponent,
  ],
})
export class AppWorkloadsCardComponent {
  readonly app = input.required<App>();

  readonly AppState = AppState;

  protected readonly requiredRoles = [Role.AppsWrite];
  protected readonly appContainerStateLabels = appContainerStateLabels;
  protected readonly helptext = helptextApps;

  constructor(
    private matDialog: MatDialog,
    private router: Router,
    private translate: TranslateService,
  ) {}

  protected readonly hostPorts = computed(() => {
    const hostPorts: { hostIp: string; hostPort: string; containerPort: string; protocol: string }[] = [];

    this.app().active_workloads.used_ports.forEach((port) => {
      port.host_ports.forEach((hostPort) => {
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
    this.matDialog.open(VolumeMountsDialogComponent, {
      minWidth: '60vw',
      data: containerDetails,
    });
  }

  shellButtonPressed(containerId: string): void {
    this.matDialog.open(ShellDetailsDialogComponent, {
      minWidth: '650px',
      maxWidth: '850px',
      data: {
        appName: this.app().name,
        title: this.translate.instant('Choose Shell Details'),
        type: ShellDetailsType.Shell,
        customSubmit: (values: ShellDetailsDialogFormValue) => this.shellDialogSubmit(values, containerId),
      },
    });
  }

  viewLogsButtonPressed(containerDetails: AppContainerDetails): void {
    this.router.navigate([
      '/apps',
      'installed',
      this.app().metadata.train,
      this.app().name,
      'logs',
      containerDetails.id,
    ]);
  }

  private shellDialogSubmit(formValue: ShellDetailsDialogFormValue, containerId: string): void {
    this.router.navigate([
      '/apps',
      'installed',
      this.app().metadata.train,
      this.app().name,
      'shell',
      containerId,
      formValue.command,
    ]);
  }
}
