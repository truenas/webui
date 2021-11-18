import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { NavigationExtras, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { CoreService } from 'app/core/services/core-service/core.service';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { CoreEvent } from 'app/interfaces/events';
import { ServiceRow } from 'app/interfaces/service.interface';
import { EmptyConfig, EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { ToolbarConfig } from 'app/pages/common/entity/entity-toolbar/models/control-config.interface';
import { ServicesService } from 'app/pages/services/services.service';
import { IscsiService } from 'app/services/';
import { DialogService } from 'app/services/dialog.service';

@UntilDestroy()
@Component({
  selector: 'services',
  styleUrls: ['./services.component.scss'],
  templateUrl: './services.component.html',
  providers: [IscsiService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesComponent implements OnInit {
  dataSource: MatTableDataSource<ServiceRow> = new MatTableDataSource([]);
  displayedColumns = ['name', 'state', 'enable', 'actions'];
  toolbarConfig: ToolbarConfig;
  settingsEvent$: Subject<CoreEvent> = new Subject();
  filterString = '';
  rowIdentifier = 'name';
  loading = true;
  loadingConf: EmptyConfig = {
    type: EmptyType.Loading,
    large: false,
    title: this.translate.instant('Loading...'),
  };
  readonly ServiceStatus = ServiceStatus;

  constructor(
    private router: Router,
    private translate: TranslateService,
    private dialog: DialogService,
    private iscsiService: IscsiService,
    private services: ServicesService,
    private cdr: ChangeDetectorRef,
    private core: CoreService,
  ) {}

  ngOnInit(): void {
    this.setupToolbar();
    this.getData();
  }

  getData(): void {
    this.services.getAll().pipe(
      take(1),
      untilDestroyed(this),
    ).subscribe(
      (services) => {
        this.dataSource = new MatTableDataSource(services);
        this.loading = false;
        this.cdr.markForCheck();
      },
      () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
      () => {
        this.getServicesUpdates();
      },
    );
  }

  getServicesUpdates(): void {
    this.services.getUpdates().pipe(
      untilDestroyed(this),
    ).subscribe(() => {
      this.getData();
      this.cdr.markForCheck();
    });
  }

  onSliderChange(service: ServiceRow): void {
    this.toggle(service);
  }

  onCheckboxChange(service: ServiceRow): void {
    this.enableToggle(service);
  }

  toggle(service: ServiceRow): void {
    const rpc = service.state === ServiceStatus.Running ? 'service.stop' : 'service.start';

    const serviceName = this.services.getServiceName(service);

    if (rpc === 'service.stop') {
      if (service.service == ServiceName.Iscsi) {
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

  updateService(rpc: 'service.start' | 'service.stop', service: ServiceRow): void {
    let waiting = true;
    this.cdr.markForCheck();
    // Delay spinner for fast API responses
    setTimeout(() => {
      if (waiting) service.onChanging = true;
      this.cdr.markForCheck();
    }, 1000);

    const serviceName = this.services.getServiceName(service);
    this.services.startStopAction(rpc, service.service).pipe(
      untilDestroyed(this),
    ).subscribe((res) => {
      if (res) {
        if (service.state === ServiceStatus.Running && rpc === 'service.stop') {
          this.dialog.info(
            this.translate.instant('Service failed to stop'),
            this.translate.instant('{serviceName} service failed to stop.', { serviceName }),
          );
        }
        service.state = ServiceStatus.Running;
        service.onChanging = false;
        waiting = false;
      } else {
        if (service.state === ServiceStatus.Stopped && rpc === 'service.start') {
          this.dialog.info(
            this.translate.instant('Service failed to start'),
            this.translate.instant('{serviceName} service failed to start.', { serviceName }),
          );
        }
        service.state = ServiceStatus.Stopped;
        service.onChanging = false;
        waiting = false;
      }
      this.cdr.markForCheck();
    }, (res) => {
      let message = this.translate.instant('Error starting service {serviceName}.', { serviceName });
      if (rpc === 'service.stop') {
        message = this.translate.instant('Error stopping service {serviceName}.', { serviceName });
      }
      this.dialog.errorReport(message, res.message, res.stack);
      service.onChanging = false;
      waiting = false;
      this.cdr.markForCheck();
    });
  }

  enableToggle(service: ServiceRow): void {
    this.services.enableDisableAction(service.id, service.enable)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (!res) {
          // Middleware should return the service id
          throw new Error('Method service.update failed. No response from server');
        }
        this.cdr.markForCheck();
      });
  }

  configureService(row: ServiceRow): void {
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

  setupToolbar(): void {
    this.settingsEvent$ = new Subject();
    this.settingsEvent$.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      if (evt.data.event_control == 'filter') {
        this.filterString = evt.data.filter;
        this.dataSource.filter = evt.data.filter;
      }
    });

    const controls = [
      {
        name: 'filter',
        type: 'input',
        value: this.filterString,
        placeholder: this.translate.instant('Search'),
      },
    ];

    const toolbarConfig = {
      target: this.settingsEvent$,
      controls,
    };
    const settingsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: toolbarConfig,
    };

    this.toolbarConfig = toolbarConfig;

    this.core.emit({ name: 'GlobalActions', data: settingsConfig, sender: this });
  }
}
