import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ServiceName } from 'app/enums/service-name.enum';
import { Service } from 'app/interfaces/service.interface';
import { WebSocketService } from 'app/services/index';

@Injectable({
  providedIn: 'root',
})
export class ServicesService {
  private readonly hiddenServices: ServiceName[] = [ServiceName.Gluster, ServiceName.Afp];

  constructor(private ws: WebSocketService) { }

  getAll(): Observable<Service[]> {
    return this.ws.call('service.query', [[], { order_by: ['service'] }]).pipe(
      map((services) => {
        return services
          .filter((service) => !this.hiddenServices.includes(service.service));
      }),
    );
  }

  getUpdates(): Observable<Service> {
    return this.ws.subscribe('service.query').pipe(
      map((event) => event.fields),
      filter((service) => !this.hiddenServices.includes(service.service)),
    );
  }

  startStopAction(rpc: 'service.start' | 'service.stop', service: ServiceName): Observable<boolean> {
    return this.ws.call(rpc, [service]);
  }

  enableDisableAction(id: number, enable: boolean): Observable<number> {
    return this.ws.call('service.update', [id, { enable }]);
  }
}
