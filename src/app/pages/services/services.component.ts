import { Component, OnInit } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter, switchMap } from 'rxjs/operators';
import { ServiceName, serviceNames } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { Service } from 'app/interfaces/service.interface';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { IscsiService, SystemGeneralService, WebSocketService } from 'app/services/';
import { DialogService } from 'app/services/dialog.service';
import { T } from 'app/translate-marker';

interface ServiceRow extends Service {
  onChanging: boolean;
  name: string;
}

@UntilDestroy()
@Component({
  selector: 'services',
  styleUrls: ['./services.component.scss'],
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
  providers: [IscsiService],
})
export class Services implements EntityTableConfig, OnInit {
  title = 'Services';
  isFooterConsoleOpen: boolean;
  queryCall: 'service.query' = 'service.query';
  queryCallOption: QueryParams<Service> = [[], { order_by: ['service'] }];
  rowIdentifier = 'name';
  protected inlineActions = true;

  columns = [
    { name: 'Name', prop: 'name', always_display: true },
    {
      name: 'Running', prop: 'state', toggle: true, always_display: true,
    },
    {
      name: 'Start Automatically', prop: 'enable', checkbox: true, always_display: true,
    },
  ];

  config: any = {
    paging: false,
    sorting: { columns: this.columns },
  };
  services: any[];

  showSpinner = true;

  constructor(
    protected ws: WebSocketService,
    protected router: Router,
    private dialog: DialogService,
    private iscsiService: IscsiService,
    private sysGeneralService: SystemGeneralService,
  ) {}

  resourceTransformIncomingRestData(services: Service[]): ServiceRow[] {
    const hidden = [ServiceName.Gluster, ServiceName.Afp];

    return services
      .filter((service) => !hidden.includes(service.service))
      .map((service) => ({
        ...service,
        name: this.getServiceName(service),
        onChanging: false,
      }));
  }

  ngOnInit(): void {
    this.sysGeneralService.getAdvancedConfig.pipe(untilDestroyed(this)).subscribe((res) => {
      if (res) {
        this.isFooterConsoleOpen = res.consolemsg;
      }
    });
  }

  getActions(parentRow: ServiceRow): EntityTableAction[] {
    return [{
      actionName: 'configure',
      name: parentRow.service,
      icon: 'edit',
      id: 'Configure',
      label: T('Configure'),
      onClick: (row: ServiceRow) => {
        if (row.service === ServiceName.OpenVpnClient || row.service === ServiceName.OpenVpnServer) {
          const navigationExtras: NavigationExtras = { state: { configureOpenVPN: row.service.replace('openvpn_', '') } };
          this.router.navigate(['network'], navigationExtras);
        } else {
          this.editService(row.service);
        }
      },
    }];
  }

  onSliderChange(service: ServiceRow): void {
    this.toggle(service);
  }

  onCheckboxChange(service: ServiceRow): void {
    this.enableToggle(service);
  }

  toggle(service: ServiceRow): void {
    const rpc = service.state === ServiceStatus.Running ? 'service.stop' : 'service.start';

    const serviceName = this.getServiceName(service);

    if (rpc === 'service.stop') {
      if (service.service == ServiceName.Iscsi) {
        this.iscsiService.getGlobalSessions().pipe(
          switchMap((sessions) => {
            const msg = sessions.length == 0 ? '' : T('<font color="red"> There are ') + sessions.length
              + T(' active iSCSI connections.</font><br>Stop the ' + serviceName + ' service and close these connections?');

            return this.dialog.confirm(
              T('Alert'),
              msg == '' ? T('Stop ') + serviceName + '?' : msg,
              true,
              T('Stop'),
            );
          }),
          filter(Boolean),
        ).pipe(untilDestroyed(this)).subscribe(() => this.updateService(rpc, service));
      } else {
        this.dialog.confirm(
          T('Alert'),
          T('Stop ') + serviceName + '?',
          true,
          T('Stop'),
        ).pipe(untilDestroyed(this)).subscribe((res: boolean) => {
          if (!res) {
            return;
          }

          this.updateService(rpc, service);
        });
      }
    } else {
      this.updateService(rpc, service);
    }
  }

  updateService(rpc: 'service.start' | 'service.stop', service: ServiceRow): void {
    service.onChanging = true;
    const serviceName = this.getServiceName(service);
    this.ws.call(rpc, [service.service]).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res) {
        if (service.state === ServiceStatus.Running && rpc === 'service.stop') {
          this.dialog.Info(
            T('Service failed to stop'),
            serviceName + ' ' + T('service failed to stop.'),
          );
        }
        service.state = ServiceStatus.Running;
        service.onChanging = false;
      } else {
        if (service.state === ServiceStatus.Stopped && rpc === 'service.start') {
          this.dialog.Info(
            T('Service failed to start'),
            serviceName + ' ' + T('service failed to start.'),
          );
        }
        service.state = ServiceStatus.Stopped;
        service.onChanging = false;
      }
    }, (res) => {
      let message = T('Error starting service ');
      if (rpc === 'service.stop') {
        message = T('Error stopping service ');
      }
      this.dialog.errorReport(message + serviceName, res.message, res.stack);
      service.onChanging = false;
    });
  }

  enableToggle(service: ServiceRow): void {
    this.ws
      .call('service.update', [service.id, { enable: service.enable }])
      .pipe(untilDestroyed(this)).subscribe((res) => {
        if (!res) {
          return;
        }

        service.enable = !service.enable;
      });
  }

  editService(service: ServiceName): void {
    if (service === ServiceName.Iscsi) {
      // iscsi target global config route
      const route = ['sharing', 'iscsi'];
      this.router.navigate(new Array('').concat(route));
    } else if (service === ServiceName.Cifs) {
      this.router.navigate(new Array('').concat(['services', 'smb']));
    } else {
      // Determines the route path
      this.router.navigate(new Array('').concat(['services', service]));
    }
  }

  getServiceName(service: Service): string {
    return serviceNames.get(service.service) || service.service;
  }
}
