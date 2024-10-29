import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AuditService } from 'app/enums/audit.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName, serviceNames } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { ServiceSmbComponent } from 'app/pages/services/components/service-smb/service-smb.component';
import { SlideInService } from 'app/services/slide-in.service';
import { UrlOptionsService } from 'app/services/url-options.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-service-extra-actions',
  templateUrl: './service-extra-actions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconButton,
    TestDirective,
    MatMenuTrigger,
    IxIconComponent,
    MatMenu,
    RequiresRolesDirective,
    MatMenuItem,
    TranslateModule,
  ],
})
export class ServiceExtraActionsComponent {
  readonly service = input.required<Service>();
  readonly requiredRoles = input<Role[]>();
  readonly configServiceLabel = this.translate.instant('Config Service');
  readonly serviceNames = serviceNames;
  readonly serviceStateLabel = computed<string>(() => {
    return this.service().state === ServiceStatus.Running
      ? this.translate.instant('Turn Off Service')
      : this.translate.instant('Turn On Service');
  });

  readonly hasSessions = computed<boolean>(() => {
    return [ServiceName.Nfs, ServiceName.Cifs].includes(this.service().service);
  });

  readonly hasLogs = computed<boolean>(() => this.service().service === ServiceName.Cifs);

  constructor(
    private translate: TranslateService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private router: Router,
    private slideInService: SlideInService,
    private urlOptions: UrlOptionsService,
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
          } else if (service.state === ServiceStatus.Stopped && rpc === 'service.start') {
            this.dialogService.warn(
              this.translate.instant('Service failed to start'),
              this.translate.instant(
                'The {service} service failed to start.',
                { service: serviceNames.get(service.service) || service.service },
              ),
            );
          }
        },
        error: (error: WebSocketError) => {
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
            backtrace: error.trace?.formatted,
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

  // TODO: Outside of scope for this component.
  viewSessions(serviceName: ServiceName): void {
    if (serviceName === ServiceName.Cifs) {
      this.router.navigate(['/sharing', 'smb', 'status', 'sessions']);
    } else if (serviceName === ServiceName.Nfs) {
      this.router.navigate(['/sharing', 'nfs', 'sessions']);
    }
  }

  viewLogs(): void {
    const url = this.urlOptions.buildUrl('/system/audit', {
      searchQuery: {
        isBasicQuery: false,
        filters: [['service', '=', AuditService.Smb]],
      },
    });
    this.router.navigateByUrl(url);
  }
}
