import { ChangeDetectionStrategy, Component, computed, input, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconButtonComponent, TnTestIdDirective } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AuditService } from 'app/enums/audit.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { Service } from 'app/interfaces/service.interface';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { GlobalTargetConfigurationComponent } from 'app/pages/sharing/iscsi/global-target-configuration/global-target-configuration.component';
import { NvmeOfConfigurationComponent } from 'app/pages/sharing/nvme-of/nvme-of-configuration/nvme-of-configuration.component';
import { ServicesService } from 'app/services/services.service';
import { AuditUrlOptions, UrlOptionsService } from 'app/services/url-options.service';

@Component({
  selector: 'ix-service-actions-cell',
  templateUrl: './service-actions-cell.component.html',
  styleUrls: ['./service-actions-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnTestIdDirective,
    TnIconButtonComponent,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class ServiceActionsCellComponent {
  private urlOptions = inject(UrlOptionsService);
  private router = inject(Router);
  private servicesService = inject(ServicesService);
  private slideIn = inject(SlideIn);

  readonly service = input.required<Service>();

  /** Emitted for services whose config form is hosted in the page-level side panel. */
  readonly configure = output<Service>();

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
      default:
        // The service config forms are hosted in the page-level side panel.
        this.configure.emit(this.service());
        break;
    }
  }

  private auditLogsUrl(): string {
    return this.urlOptions.buildUrl('/system/audit', {
      service: AuditService.Smb,
    } as AuditUrlOptions);
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
