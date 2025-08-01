import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AuditService } from 'app/enums/audit.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { Service } from 'app/interfaces/service.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ServiceFtpComponent } from 'app/pages/services/components/service-ftp/service-ftp.component';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { ServiceSmbComponent } from 'app/pages/services/components/service-smb/service-smb.component';
import { ServiceSnmpComponent } from 'app/pages/services/components/service-snmp/service-snmp.component';
import { ServiceSshComponent } from 'app/pages/services/components/service-ssh/service-ssh.component';
import { ServiceUpsComponent } from 'app/pages/services/components/service-ups/service-ups.component';
import { GlobalTargetConfigurationComponent } from 'app/pages/sharing/iscsi/global-target-configuration/global-target-configuration.component';
import { NvmeOfConfigurationComponent } from 'app/pages/sharing/nvme-of/nvme-of-configuration/nvme-of-configuration.component';
import { ServicesService } from 'app/services/services.service';
import { UrlOptionsService } from 'app/services/url-options.service';

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
  private urlOptions = inject(UrlOptionsService);
  private router = inject(Router);
  private servicesService = inject(ServicesService);
  private slideIn = inject(SlideIn);

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

  protected uniqueRowTag = computed(() => {
    return 'service-' + this.service().service.replace(/\./g, '');
  });

  navigateToAuditLogs(): void {
    this.router.navigate([this.auditLogsUrl()]);
  }

  navigateToSessions(): void {
    this.router.navigate(this.sessionsUrl());
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
