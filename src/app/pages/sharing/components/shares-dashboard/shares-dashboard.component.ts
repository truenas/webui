import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import _ from 'lodash';
import { filter, map } from 'rxjs/operators';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { IscsiService } from 'app/services/iscsi.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './shares-dashboard.component.html',
  styleUrls: ['./shares-dashboard.component.scss'],
  providers: [IscsiService],
})
export class SharesDashboardComponent {
  smbService: Service = null;
  nfsService: Service = null;
  iscsiService: Service = null;

  readonly servicesToCheck = [ServiceName.Cifs, ServiceName.Iscsi, ServiceName.Nfs];
  readonly ServiceStatus = ServiceStatus;

  isClustered = false;

  constructor(private ws: WebSocketService) {
    this.getInitialServiceStatus();
    this.loadClusteredState();
  }

  loadClusteredState(): void {
    this.ws.call('cluster.utils.is_clustered').pipe(untilDestroyed(this)).subscribe((isClustered: boolean) => {
      this.isClustered = isClustered;
    });
  }

  getInitialServiceStatus(): void {
    this.ws
      .call('service.query', [])
      .pipe(untilDestroyed(this))
      .subscribe((services) => {
        this.servicesToCheck.forEach((service) => {
          this.updateTableService(_.find(services, { service }));
        });
        this.subscribeToServiceUpdates();
      });
  }

  subscribeToServiceUpdates(): void {
    this.ws
      .subscribe('service.query')
      .pipe(
        map((event) => event.fields),
        filter((service: Service) => this.servicesToCheck.includes(service.service)),
        untilDestroyed(this),
      )
      .subscribe((service: Service) => {
        this.updateTableService(service);
      });
  }

  updateTableService(service: Service, status?: ServiceStatus): void {
    switch (service.service) {
      case ServiceName.Cifs:
        this.smbService = { ...service, state: (status || service.state) };
        break;
      case ServiceName.Nfs:
        this.nfsService = { ...service, state: (status || service.state) };
        break;
      case ServiceName.Iscsi:
        this.iscsiService = { ...service, state: (status || service.state) };
    }
  }
}
