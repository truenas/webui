import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AuditService } from 'app/enums/audit.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName, serviceNames, ServiceOperation } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { Service } from 'app/interfaces/service.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { ServiceSmbComponent } from 'app/pages/services/components/service-smb/service-smb.component';
import { ServiceWebshareComponent } from 'app/pages/services/components/service-webshare/service-webshare.component';
import {
  GlobalTargetConfigurationComponent,
} from 'app/pages/sharing/iscsi/global-target-configuration/global-target-configuration.component';
import {
  NvmeOfConfigurationComponent,
} from 'app/pages/sharing/nvme-of/nvme-of-configuration/nvme-of-configuration.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AuditUrlOptions, UrlOptionsService } from 'app/services/url-options.service';

@UntilDestroy()
@Component({
  selector: 'ix-service-extra-actions',
  templateUrl: './service-extra-actions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconButton,
    TestDirective,
    MatMenuTrigger,
    IxIconComponent,
    MatMenu,
    RequiresRolesDirective,
    MatMenuItem,
    TranslateModule,
    MatTooltip,
  ],
})
export class ServiceExtraActionsComponent {
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private router = inject(Router);
  private slideIn = inject(SlideIn);
  private urlOptions = inject(UrlOptionsService);
  private errorHandler = inject(ErrorHandlerService);
  private loader = inject(LoaderService);
  private snackbar = inject(SnackbarService);

  readonly service = input.required<Service>();
  readonly requiredRoles = input<Role[]>([]);
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

  changeServiceState(service: Service): void {
    if (service.state === ServiceStatus.Running) {
      this.stopService(service);
    } else {
      this.startService(service);
    }
  }

  configureService(service: Service): void {
    switch (service.service) {
      case ServiceName.NvmeOf:
        this.slideIn.open(NvmeOfConfigurationComponent);
        break;
      case ServiceName.Iscsi:
        this.slideIn.open(GlobalTargetConfigurationComponent);
        break;
      case ServiceName.Nfs:
        this.slideIn.open(ServiceNfsComponent, { wide: true });
        break;
      case ServiceName.Cifs:
        this.slideIn.open(ServiceSmbComponent);
        break;
      case ServiceName.WebShare:
        this.slideIn.open(ServiceWebshareComponent);
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
      service: AuditService.Smb,
    } as AuditUrlOptions);
    this.router.navigateByUrl(url);
  }

  private startService(service: Service): void {
    this.api.job('service.control', [ServiceOperation.Start, service.service, { silent: false }])
      .pipe(
        observeJob(),
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe({
        complete: () => this.snackbar.success(this.translate.instant('Service started')),
      });
  }

  private stopService(service: Service): void {
    this.api.job('service.control', [ServiceOperation.Stop, service.service, { silent: false }])
      .pipe(
        observeJob(),
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe({
        complete: () => this.snackbar.success(this.translate.instant('Service stopped')),
      });
  }
}
