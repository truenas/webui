import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { IscsiService } from 'app/services/iscsi.service';
import { WebSocketService } from 'app/services/ws.service';
import { ServicesState } from 'app/store/services/services.reducer';
import { waitForServices } from 'app/store/services/services.selectors';

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

  constructor(private ws: WebSocketService, private store$: Store<ServicesState>) {
    this.getInitialServiceStatus();
    this.loadClusteredState();
  }

  loadClusteredState(): void {
    this.ws.call('cluster.utils.is_clustered').pipe(untilDestroyed(this)).subscribe((isClustered: boolean) => {
      this.isClustered = isClustered;
    });
  }

  getInitialServiceStatus(): void {
    this.store$
      .pipe(
        waitForServices,
        map((services) => services.filter((service) => this.servicesToCheck.includes(service.service))),
        untilDestroyed(this),
      )
      .subscribe((services) => {
        services.forEach((service) => {
          this.updateTableService(service);
        });
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
