import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ServiceName, serviceNames } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { ServiceSmbComponent } from 'app/pages/services/components/service-smb/service-smb.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-service-extra-actions',
  templateUrl: './service-extra-actions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceExtraActionsComponent {
  @Input() service: Service;

  configServiceLabel = this.translate.instant('Config Service');
  readonly serviceNames = serviceNames;

  get serviceStateLabel(): string {
    return this.service.state === ServiceStatus.Running
      ? this.translate.instant('Turn Off Service')
      : this.translate.instant('Turn On Service');
  }

  get hasSessions(): boolean {
    return this.service.service === ServiceName.Cifs || this.service.service === ServiceName.Nfs;
  }

  constructor(
    private translate: TranslateService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private router: Router,
    private slideInService: IxSlideInService,
  ) {}

  changeServiceState(service: Service): void {
    const rpc = service.state === ServiceStatus.Running ? 'service.stop' : 'service.start';
    this.ws.call(rpc, [service.service, { silent: false }])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (hasChanged: boolean) => {
          if (hasChanged) {
            if (service.state === ServiceStatus.Running && rpc === 'service.stop') {
              this.dialogService.warn(
                this.translate.instant('Service failed to stop'),
                this.translate.instant(
                  'The {service} service failed to stop.',
                  { service: serviceNames.get(service.service) || service.service },
                ),
              );
            }
          } else {
            if (service.state === ServiceStatus.Stopped && rpc === 'service.start') {
              this.dialogService.warn(
                this.translate.instant('Service failed to start'),
                this.translate.instant(
                  'The {service} service failed to start.',
                  { service: serviceNames.get(service.service) || service.service },
                ),
              );
            }
          }
        },
        error: (error: WebsocketError) => {
          let message = this.translate.instant(
            'Error starting service {serviceName}.',
            { serviceName: serviceNames.get(service.service) || service.service },
          );
          if (rpc === 'service.stop') {
            message = this.translate.instant(
              'Error stopping service {serviceName}.',
              { serviceName: serviceNames.get(service.service) || service.service },
            );
          }
          this.dialogService.error({
            title: message,
            message: error.reason,
            backtrace: error.trace.formatted,
          });
        },
      });
  }

  configureService(service: Service): void {
    switch (service.service) {
      case ServiceName.Iscsi:
        this.router.navigate(['/sharing', 'iscsi']);
        break;
      case ServiceName.Nfs:
        this.slideInService.open(ServiceNfsComponent, { wide: true });
        break;
      case ServiceName.Cifs:
        this.slideInService.open(ServiceSmbComponent);
        break;
      default:
        break;
    }
  }

  viewSessions(serviceName: ServiceName): void {
    if (serviceName === ServiceName.Cifs) {
      this.router.navigate(['/sharing', 'smb', 'sessions']);
    } else if (serviceName === ServiceName.Nfs) {
      this.router.navigate(['/sharing', 'nfs', 'sessions']);
    }
  }
}
