import { Injectable } from '@angular/core';
import {
  combineLatest,
  from, mergeMap, Observable, of, tap, toArray,
} from 'rxjs';
import { map, take } from 'rxjs/operators';
import { NvmeOfTransportType } from 'app/enums/nvme-of.enum';
import { NvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { LicenseService } from 'app/services/license.service';

@Injectable({
  providedIn: 'root',
})
export class NvmeOfService {
  private maxConcurrentRequests = 15;

  private cachedRdmaEnabled: boolean | null = null;

  constructor(
    private api: ApiService,
    private license: LicenseService,
  ) {}

  getSupportedTransports(): Observable<NvmeOfTransportType[]> {
    return combineLatest([
      this.license.hasFibreChannel$,
      this.isRdmaEnabled(),
    ])
      .pipe(
        map(([hasFibreChannel, isRdmaEnabled]) => {
          const transports = [NvmeOfTransportType.Tcp];

          if (hasFibreChannel) {
            transports.push(NvmeOfTransportType.FibreChannel);
          }

          if (isRdmaEnabled) {
            transports.push(NvmeOfTransportType.Rdma);
          }

          return transports;
        }),
        take(1),
      );
  }

  isRdmaEnabled(): Observable<boolean> {
    if (this.cachedRdmaEnabled === null) {
      return this.api.call('nvmet.global.rdma_enabled').pipe(
        tap((rdmaEnabled) => {
          this.cachedRdmaEnabled = rdmaEnabled;
        }),
      );
    }

    return of(this.cachedRdmaEnabled);
  }

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
