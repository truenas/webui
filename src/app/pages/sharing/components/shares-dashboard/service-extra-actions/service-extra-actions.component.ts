import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { NavigateAndInteractService } from 'app/directives/navigate-and-interact/navigate-and-interact.service';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AuditService } from 'app/enums/audit.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName, serviceNames } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { ServiceSmbComponent } from 'app/pages/services/components/service-smb/service-smb.component';
import {
  GlobalTargetConfigurationComponent,
} from 'app/pages/sharing/iscsi/global-target-configuration/global-target-configuration.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SlideInService } from 'app/services/slide-in.service';
import { UrlOptionsService } from 'app/services/url-options.service';
import { ApiService } from 'app/services/websocket/api.service';

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
    private api: ApiService,
    private router: Router,
    private slideInService: SlideInService,
    private urlOptions: UrlOptionsService,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    private snackbar: SnackbarService,
    private navigateAndInteract: NavigateAndInteractService,
  ) {}

  changeServiceState(service: Service): void {
    if (service.state === ServiceStatus.Running) {
      this.stopService(service);
    } else {
      this.startService(service);
    }
  }

  configureService(service: Service): void {
    switch (service.service) {
      case ServiceName.Iscsi:
        this.slideInService.open(GlobalTargetConfigurationComponent);
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

  private startService(service: Service): void {
    this.api.call('service.start', [service.service, { silent: false }])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Service started'));
      });
  }

  private stopService(service: Service): void {
    this.api.call('service.stop', [service.service, { silent: false }])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Service stopped'));
      });
  }
}
