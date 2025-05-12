import { Injectable } from '@angular/core';
import {
  from, mergeMap, Observable, of, toArray,
} from 'rxjs';
import { NvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';
import { ApiService } from 'app/modules/websocket/api.service';

@Injectable({
  providedIn: 'root',
})
export class NvmeOfService {
  private maxConcurrentRequests = 15;

  constructor(
    private api: ApiService,
  ) {}

  associatePorts(subsystem: NvmeOfSubsystem, portIds: number[]): Observable<unknown> {
    if (portIds.length === 0) {
      return of(undefined);
    }

    return from(portIds).pipe(
      mergeMap((portId) => {
        return this.api.call('nvmet.port_subsys.create', [{ port_id: portId, subsys_id: subsystem.id }]);
      }, this.maxConcurrentRequests),
      toArray(),
    );
  }

  associateHosts(subsystem: NvmeOfSubsystem, hosts: number[]): Observable<unknown> {
    if (hosts.length === 0) {
      return of(undefined);
    }

    return from(hosts).pipe(
      mergeMap((hostId) => {
        return this.api.call('nvmet.host_subsys.create', [{ host_id: hostId, subsys_id: subsystem.id }]);
      }, this.maxConcurrentRequests),
      toArray(),
    );
  }
}
