import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import type { TnMenuItem } from '@truenas/ui-components';
import { AuditService } from 'app/enums/audit.enum';
import { ServiceName, serviceNames, ServiceOperation } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { Service } from 'app/interfaces/service.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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

@Injectable({ providedIn: 'root' })
export class ServiceActionsMenuService {
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private router = inject(Router);
  private slideIn = inject(SlideIn);
  private urlOptions = inject(UrlOptionsService);
  private errorHandler = inject(ErrorHandlerService);
  private loader = inject(LoaderService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  buildMenuItems(service: Service, hasControlRole: boolean): TnMenuItem[] {
    const items: TnMenuItem[] = [];

    if (hasControlRole) {
      const stateLabel = service.state === ServiceStatus.Running
        ? this.translate.instant('Turn Off Service')
        : this.translate.instant('Turn On Service');
      items.push({
        id: 'service-state-toggle',
        label: stateLabel,
        action: () => this.changeServiceState(service),
      });
    }

    items.push({
      id: 'service-config',
      label: this.translate.instant('Config Service'),
      action: () => this.configureService(service),
    });

    if ([ServiceName.Nfs, ServiceName.Cifs].includes(service.service)) {
      items.push({
        id: 'service-sessions',
        label: this.translate.instant('{name} Sessions', { name: serviceNames.get(service.service) }),
        action: () => this.viewSessions(service.service),
      });
    }

    if (service.service === ServiceName.Cifs) {
      items.push({
        id: 'service-logs',
        label: this.translate.instant('Audit Logs'),
        action: () => this.viewLogs(),
      });
    }

    return items;
  }

  private changeServiceState(service: Service): void {
    if (service.state === ServiceStatus.Running) {
      this.stopService(service);
    } else {
      this.startService(service);
    }
  }

  private configureService(service: Service): void {
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

  private viewSessions(serviceName: ServiceName): void {
    if (serviceName === ServiceName.Cifs) {
      this.router.navigate(['/sharing', 'smb', 'status', 'sessions']);
    } else if (serviceName === ServiceName.Nfs) {
      this.router.navigate(['/sharing', 'nfs', 'sessions']);
    }
  }

  private viewLogs(): void {
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
        takeUntilDestroyed(this.destroyRef),
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
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        complete: () => this.snackbar.success(this.translate.instant('Service stopped')),
      });
  }
}
