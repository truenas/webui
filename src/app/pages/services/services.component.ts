import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { map, switchMap,
} from 'rxjs/operators';
import { EmptyType } from 'app/enums/empty-type.enum';
import { ServiceName, serviceNames } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { Service, ServiceRow } from 'app/interfaces/service.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { ServiceFtpComponent } from 'app/pages/services/components/service-ftp/service-ftp.component';
import { ServiceLldpComponent } from 'app/pages/services/components/service-lldp/service-lldp.component';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { ServiceSmartComponent } from 'app/pages/services/components/service-smart/service-smart.component';
import { ServiceSmbComponent } from 'app/pages/services/components/service-smb/service-smb.component';
import { ServiceSnmpComponent } from 'app/pages/services/components/service-snmp/service-snmp.component';
import { ServiceSshComponent } from 'app/pages/services/components/service-ssh/service-ssh.component';
import { ServiceUpsComponent } from 'app/pages/services/components/service-ups/service-ups.component';
import { DialogService } from 'app/services/dialog.service';
import { IscsiService } from 'app/services/iscsi.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { ServicesState } from 'app/store/services/services.reducer';
import { waitForServices } from 'app/store/services/services.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-services',
  styleUrls: ['./services.component.scss'],
  templateUrl: './services.component.html',
  providers: [IscsiService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesComponent implements OnInit {
  dataSource = new MatTableDataSource<ServiceRow>([]);
  displayedColumns = ['name', 'state', 'enable', 'actions'];
  error = false;
  loading = true;
  serviceLoadingMap = new Map<ServiceName, boolean>();
  readonly serviceNames = serviceNames;
  readonly ServiceStatus = ServiceStatus;

  get emptyConfig(): EmptyConfig {
    if (this.loading) {
      return this.emptyService.defaultEmptyConfig(EmptyType.Loading);
    }
    if (this.error) {
      return this.emptyService.defaultEmptyConfig(EmptyType.Errors);
    }
    if (!this.dataSource.data.length) {
      return this.emptyService.defaultEmptyConfig(EmptyType.NoPageData);
    }

    return this.emptyService.defaultEmptyConfig(EmptyType.NoSearchResults);
  }

  constructor(
    private ws: WebSocketService,
    private router: Router,
    private translate: TranslateService,
    private dialog: DialogService,
    private iscsiService: IscsiService,
    private cdr: ChangeDetectorRef,
    private emptyService: EmptyService,
    private slideInService: IxSlideInService,
    private store$: Store<ServicesState>,
  ) {}

  ngOnInit(): void {
    this.getData();
  }

  get shouldShowEmpty(): boolean {
    return !this.dataSource.filteredData.length;
  }

  getData(): void {
    this.loading = true;
    this.error = false;

    this.store$.pipe(
      waitForServices,
      map((services) => {
        return services.map((service) => {
          return {
            ...service,
            name: serviceNames.has(service.service) ? serviceNames.get(service.service) : service.service,
          } as ServiceRow;
        });
      }),
      untilDestroyed(this),
    ).subscribe({
      next: (services) => {
        this.dataSource = new MatTableDataSource(services);
        this.loading = false;
        this.error = false;
        this.setLoadingServiceMapFalse();
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.setLoadingServiceMapFalse();
        this.cdr.markForCheck();
      },
    });
  }

  onSliderChange(service: Service): void {
    this.toggle(service);
  }

  onCheckboxChange(service: Service): void {
    this.enableToggle(service);
  }

  toggle(service: Service): void {
    const rpc = service.state === ServiceStatus.Running ? 'service.stop' : 'service.start';

    const serviceName = this.serviceNames.get(service.service);
    if (rpc === 'service.stop') {
      if (service.service === ServiceName.Iscsi) {
        this.iscsiService.getGlobalSessions().pipe(
          switchMap((sessions) => {
            let message = this.translate.instant('Stop {serviceName}?', { serviceName });
            if (sessions.length) {
              message = `<font color="red">${this.translate.instant('There are {sessions} active iSCSI connections.', { sessions: sessions.length })}</font><br>${this.translate.instant('Stop the {serviceName} service and close these connections?', { serviceName })}`;
            }

            return this.dialog.confirm({
              title: this.translate.instant('Alert'),
              message,
              hideCheckbox: true,
              buttonText: this.translate.instant('Stop'),
            });
          }),
          untilDestroyed(this),
        ).subscribe((confirmed) => {
          if (confirmed) {
            this.updateService(rpc, service);
          } else {
            this.resetServiceStateToDefault(service);
          }
        });
      } else {
        this.dialog.confirm({
          title: this.translate.instant('Alert'),
          message: this.translate.instant('Stop {serviceName}?', { serviceName }),
          hideCheckbox: true,
          buttonText: this.translate.instant('Stop'),
        }).pipe(
          untilDestroyed(this),
        ).subscribe((confirmed) => {
          if (confirmed) {
            this.updateService(rpc, service);
          } else {
            this.resetServiceStateToDefault(service);
          }
        });
      }
    } else {
      this.updateService(rpc, service);
    }
  }

  updateService(rpc: 'service.start' | 'service.stop', service: Service): void {
    if (this.serviceLoadingMap.get(service.service)) {
      return;
    }
    this.serviceLoadingMap.set(service.service, true);
    this.cdr.markForCheck();

    const serviceName = this.serviceNames.get(service.service);
    this.ws.call(rpc, [service.service, { silent: false }]).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (success) => {
        if (success) {
          if (service.state === ServiceStatus.Running && rpc === 'service.stop') {
            this.dialog.warn(
              this.translate.instant('Service failed to stop'),
              this.translate.instant('{serviceName} service failed to stop.', { serviceName }),
            );
          }
        } else if (service.state === ServiceStatus.Stopped && rpc === 'service.start') {
          this.dialog.warn(
            this.translate.instant('Service failed to start'),
            this.translate.instant('{serviceName} service failed to start.', { serviceName }),
          );
        }
      },
      error: (error: WebsocketError) => {
        let message = this.translate.instant('Error starting service {serviceName}.', { serviceName });
        if (rpc === 'service.stop') {
          message = this.translate.instant('Error stopping service {serviceName}.', { serviceName });
        }
        this.dialog.error({
          title: message,
          message: error.reason,
          backtrace: error.trace.formatted,
        });
        this.serviceLoadingMap.set(service.service, false);
        this.cdr.markForCheck();
      },
    });
  }

  enableToggle(service: Service): void {
    this.ws.call('service.update', [service.id, { enable: service.enable }])
      .pipe(untilDestroyed(this))
      .subscribe((updated) => {
        if (!updated) {
          // To uncheck the checkbox
          service.enable = false;
          // Middleware should return the service id
          throw new Error('Method service.update failed. No response from server');
        }
        this.cdr.markForCheck();
      });
  }

  configureService(row: Service): void {
    switch (row.service) {
      case ServiceName.Iscsi:
        this.router.navigate(['/sharing', 'iscsi']);
        break;
      case ServiceName.Ftp:
        this.slideInService.open(ServiceFtpComponent, { wide: true });
        break;
      case ServiceName.Nfs:
        this.slideInService.open(ServiceNfsComponent, { wide: true });
        break;
      case ServiceName.Snmp:
        this.slideInService.open(ServiceSnmpComponent, { wide: true });
        break;
      case ServiceName.Ups:
        this.slideInService.open(ServiceUpsComponent, { wide: true });
        break;
      case ServiceName.Ssh:
        this.slideInService.open(ServiceSshComponent);
        break;
      case ServiceName.Cifs:
        this.slideInService.open(ServiceSmbComponent);
        break;
      case ServiceName.Smart:
        this.slideInService.open(ServiceSmartComponent);
        break;
      case ServiceName.Lldp:
        this.slideInService.open(ServiceLldpComponent);
        break;
      default:
        break;
    }
  }

  onSearch(query: string): void {
    this.dataSource.filter = query;
    this.cdr.markForCheck();
  }

  resetServiceStateToDefault(service: Service): void {
    this.serviceLoadingMap.set(service.service, true);
    this.cdr.markForCheck();
    setTimeout(() => {
      this.serviceLoadingMap.set(service.service, false);
      this.cdr.markForCheck();
    }, 0);
  }

  setLoadingServiceMapFalse(): void {
    for (const key of serviceNames.keys()) {
      this.serviceLoadingMap.set(key, false);
    }
  }
}
