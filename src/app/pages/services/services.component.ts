import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, TemplateRef, AfterViewInit,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { NavigationExtras, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  filter, map, switchMap,
} from 'rxjs/operators';
import { ServiceName, serviceNames } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service, ServiceRow } from 'app/interfaces/service.interface';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { IscsiService } from 'app/services/';
import { DialogService } from 'app/services/dialog.service';
import { LayoutService } from 'app/services/layout.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-services',
  styleUrls: ['./services.component.scss'],
  templateUrl: './services.component.html',
  providers: [IscsiService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesComponent implements OnInit, AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  dataSource: MatTableDataSource<ServiceRow> = new MatTableDataSource([]);
  displayedColumns = ['name', 'state', 'enable', 'actions'];
  error = false;
  loading = true;
  loadingConf: EmptyConfig = {
    type: EmptyType.Loading,
    large: false,
    title: this.translate.instant('Loading...'),
  };
  serviceLoadingMap = new Map<ServiceName, boolean>();
  readonly serviceNames = serviceNames;
  readonly ServiceStatus = ServiceStatus;
  private readonly hiddenServices: ServiceName[] = [ServiceName.Gluster, ServiceName.Afp];

  constructor(
    private ws: WebSocketService,
    private router: Router,
    private translate: TranslateService,
    private dialog: DialogService,
    private iscsiService: IscsiService,
    private cdr: ChangeDetectorRef,
    private layoutService: LayoutService,
  ) {}

  ngOnInit(): void {
    this.getData();
    this.getUpdates();
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  getData(): void {
    this.ws.call('service.query', [[], { order_by: ['service'] }]).pipe(
      map((services) => {
        const transformed = services
          .filter((service) => !this.hiddenServices.includes(service.service))
          .map((service) => {
            const transformed = { ...service } as ServiceRow;
            transformed.name = serviceNames.get(service.service);

            return transformed;
          });

        transformed.sort((a, b) => a.name.localeCompare(b.name));

        return transformed;
      }),
      untilDestroyed(this),
    ).subscribe({
      next: (services) => {
        this.dataSource = new MatTableDataSource(services);
        this.loading = false;
        this.error = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.cdr.markForCheck();
      },
      complete: () => {
        for (const key of serviceNames.keys()) {
          this.serviceLoadingMap.set(key, false);
        }
      },
    });
  }

  getUpdates(): void {
    this.ws.subscribe('service.query').pipe(
      map((event) => event.fields),
      filter((service) => !this.hiddenServices.includes(service.service)),
      untilDestroyed(this),
    ).subscribe(() => {
      this.getData();
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
              hideCheckBox: true,
              buttonMsg: this.translate.instant('Stop'),
            });
          }),
          filter(Boolean),
          untilDestroyed(this),
        ).subscribe(() => {
          this.updateService(rpc, service);
        });
      } else {
        this.dialog.confirm({
          title: this.translate.instant('Alert'),
          message: this.translate.instant('Stop {serviceName}?', { serviceName }),
          hideCheckBox: true,
          buttonMsg: this.translate.instant('Stop'),
        }).pipe(
          filter(Boolean),
          untilDestroyed(this),
        ).subscribe(() => {
          this.updateService(rpc, service);
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
      error: (error) => {
        let message = this.translate.instant('Error starting service {serviceName}.', { serviceName });
        if (rpc === 'service.stop') {
          message = this.translate.instant('Error stopping service {serviceName}.', { serviceName });
        }
        this.dialog.errorReport(message, error.reason, error.trace.formatted);
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
    if (row.service === ServiceName.OpenVpnClient || row.service === ServiceName.OpenVpnServer) {
      const navigationExtras: NavigationExtras = { state: { configureOpenVPN: row.service.replace('openvpn_', '') } };
      this.router.navigate(['network'], navigationExtras);
    } else {
      switch (row.service) {
        case ServiceName.Iscsi:
          this.router.navigate(['/sharing', 'iscsi']);
          break;
        case ServiceName.Cifs:
          this.router.navigate(['/services', 'smb']);
          break;
        default:
          this.router.navigate(['/services', row.service]);
          break;
      }
    }
  }

  onSearch(query: string): void {
    this.dataSource.filter = query;
  }
}
