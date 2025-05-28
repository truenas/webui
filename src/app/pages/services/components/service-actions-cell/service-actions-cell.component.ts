import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  filter, Observable, switchMap, take,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AuditService } from 'app/enums/audit.enum';
import { ServiceName, serviceNames } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceFtpComponent } from 'app/pages/services/components/service-ftp/service-ftp.component';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { ServiceSmbComponent } from 'app/pages/services/components/service-smb/service-smb.component';
import { ServiceSnmpComponent } from 'app/pages/services/components/service-snmp/service-snmp.component';
import { ServiceSshComponent } from 'app/pages/services/components/service-ssh/service-ssh.component';
import { ServiceUpsComponent } from 'app/pages/services/components/service-ups/service-ups.component';
import { GlobalTargetConfigurationComponent } from 'app/pages/sharing/iscsi/global-target-configuration/global-target-configuration.component';
import { NvmeOfConfigurationComponent } from 'app/pages/sharing/nvme-of/nvme-of-configuration/nvme-of-configuration.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { IscsiService } from 'app/services/iscsi.service';
import { ServicesService } from 'app/services/services.service';
import { UrlOptionsService } from 'app/services/url-options.service';

@UntilDestroy()
@Component({
  selector: 'ix-service-actions-cell',
  templateUrl: './service-actions-cell.component.html',
  styleUrls: ['./service-actions-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TestDirective,
    IxIconComponent,
    RequiresRolesDirective,
    TranslateModule,
    MatIconButton,
  ],
})
export class ServiceActionsCellComponent {
  readonly service = input.required<Service>();

  protected readonly requiredRoles = computed(() => {
    return this.servicesService.getRolesRequiredToManage(this.service().service);
  });

  protected hasLogs = computed(() => {
    return this.service().service === ServiceName.Cifs;
  });

  protected hasSessions = computed(() => {
    return this.service().service === ServiceName.Cifs || this.service().service === ServiceName.Nfs;
  });

  protected isRunning = computed(() => {
    return this.service().state === ServiceStatus.Running;
  });

  protected uniqueRowTag = computed(() => {
    return 'service-' + this.service().service.replace(/\./g, '');
  });

  constructor(
    private urlOptions: UrlOptionsService,
    private router: Router,
    private dialogService: DialogService,
    private translate: TranslateService,
    private loader: LoaderService,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private iscsiService: IscsiService,
    private snackbar: SnackbarService,
    private servicesService: ServicesService,
    private slideIn: SlideIn,
  ) {}

  navigateToAuditLogs(): void {
    this.router.navigate([this.auditLogsUrl()]);
  }

  navigateToSessions(): void {
    this.router.navigate(this.sessionsUrl());
  }

  startService(): void {
    this.api.call('service.start', [this.service().service, { silent: false }]).pipe(
      this.loader.withLoader(),
      this.errorHandler.withErrorHandler(),
      untilDestroyed(this),
    ).subscribe(() => {
      this.snackbar.success(this.translate.instant('Service started'));
    });
  }

  stopServiceClicked(): void {
    this.confirmStop().pipe(
      filter(Boolean),
      take(1),
      untilDestroyed(this),
    ).subscribe(() => this.stopService());
  }

  configureService(): void {
    switch (this.service().service) {
      case ServiceName.NvmeOf:
        this.slideIn.open(NvmeOfConfigurationComponent);
        break;
      case ServiceName.Iscsi:
        this.slideIn.open(GlobalTargetConfigurationComponent);
        break;
      case ServiceName.Ftp:
        this.slideIn.open(ServiceFtpComponent, { wide: true });
        break;
      case ServiceName.Nfs:
        this.slideIn.open(ServiceNfsComponent, { wide: true });
        break;
      case ServiceName.Snmp:
        this.slideIn.open(ServiceSnmpComponent, { wide: true });
        break;
      case ServiceName.Ups:
        this.slideIn.open(ServiceUpsComponent, { wide: true });
        break;
      case ServiceName.Ssh:
        this.slideIn.open(ServiceSshComponent);
        break;
      case ServiceName.Cifs:
        this.slideIn.open(ServiceSmbComponent);
        break;
      default:
        break;
    }
  }

  private confirmStop(): Observable<boolean> {
    if (this.service().service === ServiceName.Iscsi) {
      return this.confirmStopIscsiService();
    }

    return this.dialogService.confirm({
      title: this.translate.instant('Confirm'),
      message: this.translate.instant('Are you sure you want to stop {serviceName}?', { serviceName: serviceNames.get(this.service().service) }),
      hideCheckbox: true,
      buttonColor: 'warn',
      buttonText: this.translate.instant('Stop'),
    });
  }

  private stopService(): void {
    this.api.call('service.stop', [this.service().service, { silent: false }]).pipe(
      this.loader.withLoader(),
      this.errorHandler.withErrorHandler(),
      untilDestroyed(this),
    ).subscribe(() => {
      this.snackbar.success(this.translate.instant('Service stopped'));
    });
  }

  private confirmStopIscsiService(): Observable<boolean> {
    return this.iscsiService.getGlobalSessions().pipe(
      switchMap((sessions) => {
        let message = this.translate.instant('Stop {serviceName}?', { serviceName: serviceNames.get(this.service().service) });
        if (sessions.length) {
          const connectionsMessage = this.translate.instant('{n, plural, one {There is an active iSCSI connection.} other {There are # active iSCSI connections}}', { n: sessions.length });
          const stopMessage = this.translate.instant('Stop the {serviceName} service and close these connections?', { serviceName: serviceNames.get(this.service().service) });
          message = `<font color="red">${connectionsMessage}</font><br>${stopMessage}` as TranslatedString;
        }

        return this.dialogService.confirm({
          title: this.translate.instant('Alert'),
          message,
          hideCheckbox: true,
          buttonText: this.translate.instant('Stop'),
        });
      }),
      untilDestroyed(this),
    );
  }

  private auditLogsUrl(): string {
    return this.urlOptions.buildUrl('/system/audit', {
      searchQuery: {
        isBasicQuery: false,
        filters: [['service', '=', AuditService.Smb]],
      },
    });
  }

  private sessionsUrl(): string[] {
    if (this.service().service === ServiceName.Cifs) {
      return ['/sharing', 'smb', 'status', 'sessions'];
    }
    if (this.service().service === ServiceName.Nfs) {
      return ['/sharing', 'nfs', 'sessions'];
    }
    return [];
  }
}
