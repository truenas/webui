import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ServiceName, serviceNames } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-service-extra-actions',
  templateUrl: './service-extra-actions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceExtraActionsComponent {
  @Input() service: Service;

  @Output() statusChanged = new EventEmitter<ServiceStatus>();

  configServiceLabel = this.translate.instant('Config Service');

  get serviceStateLabel(): string {
    return this.service.state === ServiceStatus.Running
      ? this.translate.instant('Turn Off Service')
      : this.translate.instant('Turn On Service');
  }

  constructor(
    private translate: TranslateService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private router: Router,
  ) {}

  updateTableServiceStatus(service: Service): void {
    this.statusChanged.emit(service.state);
  }

  changeServiceState(service: Service): void {
    const rpc = service.state === ServiceStatus.Running ? 'service.stop' : 'service.start';
    this.updateTableServiceStatus({ ...service, state: ServiceStatus.Loading });
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
            service.state = ServiceStatus.Running;
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
            service.state = ServiceStatus.Stopped;
          }
          this.updateTableServiceStatus(service);
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
    if (service.service === ServiceName.Iscsi) {
      this.router.navigate(['/sharing', 'iscsi']);
    } else {
      this.router.navigate(['/system', 'services']);
    }
  }
}
