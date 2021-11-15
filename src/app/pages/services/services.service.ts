import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ServiceName, serviceNames } from 'app/enums/service-name.enum';
import { Service, ServiceRow } from 'app/interfaces/service.interface';
import { WebSocketService } from 'app/services/index';

@Injectable({
  providedIn: 'root',
})
export class ServicesService {
  private readonly hiddenServices: ServiceName[] = [ServiceName.Gluster, ServiceName.Afp];

  constructor(private ws: WebSocketService) { }

  getAll(): Observable<ServiceRow[]> {
    return this.ws.call('service.query', [[], { order_by: ['service'] }]).pipe(
      map((services) => {
        return services
          .filter((service) => !this.hiddenServices.includes(service.service))
          .map((service) => this.transform(service));
      }),
    );
  }

  getUpdates(): Observable<ServiceRow> {
    return this.ws.subscribe('service.query').pipe(
      map((event) => event.fields),
      filter((service) => !this.hiddenServices.includes(service.service)),
      map((service) => this.transform(service)),
    );
  }

  getServiceName(service: Service): ServiceName {
    return serviceNames.get(service.service) as ServiceName || service.service;
  }

  startStopAction(rpc: 'service.start' | 'service.stop', service: ServiceName): Observable<boolean> {
    return this.ws.call(rpc, [service]);
  }

  enableDisableAction(id: number, enable: boolean): Observable<number> {
    return this.ws.call('service.update', [id, { enable }]);
  }

  transform(service: Service): ServiceRow {
    return {
      ...service,
      name: this.getServiceName(service),
      onChanging: false,
    };
  }
}
