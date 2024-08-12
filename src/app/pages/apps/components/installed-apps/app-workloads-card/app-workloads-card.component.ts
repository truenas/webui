import {
  ChangeDetectionStrategy, Component, input, computed,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { CatalogAppState } from 'app/enums/catalog-app-state.enum';
import { Role } from 'app/enums/role.enum';
import { App, AppContainerDetails, appContainerStateLabels } from 'app/interfaces/app.interface';
import {
  VolumeMountsDialogComponent,
} from 'app/pages/apps/components/installed-apps/app-workloads-card/volume-mounts-dialog/volume-mounts-dialog.component';

@UntilDestroy()
@Component({
  selector: 'ix-app-containers-card',
  templateUrl: './app-workloads-card.component.html',
  styleUrls: ['./app-workloads-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppWorkloadsCardComponent {
  readonly app = input.required<App>();

  readonly CatalogAppState = CatalogAppState;

  protected readonly requiredRoles = [Role.AppsWrite];
  protected readonly appContainerStateLabels = appContainerStateLabels;

  constructor(
    private matDialog: MatDialog,
    private router: Router,
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
      data: containerDetails,
    });
  }

  // TODO: https://ixsystems.atlassian.net/browse/NAS-130392
  shellButtonPressed(_: string): void {
  // this.matDialog.open(PodSelectDialogComponent, {
  //   minWidth: '650px',
  //   maxWidth: '850px',
  //   data: {
  //     containerImageKey,
  //     app: this.app,
  //     appName: this.app.name,
  //     title: this.translate.instant('Choose pod'),
  //     type: PodSelectDialogType.Shell,
  //     customSubmit: (values: PodDialogFormValue) => this.shellDialogSubmit(values),
  //   },
  // });
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

  // TODO: https://ixsystems.atlassian.net/browse/NAS-130392
  // private shellDialogSubmit(formValue: PodDialogFormValue): void {
  //   this.router.navigate([
  //     '/apps',
  //     'installed',
  //     this.app().metadata.train,
  //     this.app().name,
  //     'shell',
  //     formValue.pods,
  //     formValue.command,
  //   ]);
  // }
}
