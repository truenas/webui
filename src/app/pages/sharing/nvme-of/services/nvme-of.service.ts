import { Injectable } from '@angular/core';
import {
  combineLatest,
  from, mergeMap, Observable, of, switchMap, tap, toArray,
} from 'rxjs';
import { map, take } from 'rxjs/operators';
import { NvmeOfTransportType } from 'app/enums/nvme-of.enum';
import { NvmeOfHost, NvmeOfPort, NvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';
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

  associatePorts(subsystem: { id: number }, ports: NvmeOfPort[]): Observable<unknown> {
    if (ports.length === 0) {
      return of(undefined);
    }

    return from(ports).pipe(
      mergeMap((port) => {
        return this.api.call('nvmet.port_subsys.create', [{ port_id: port.id, subsys_id: subsystem.id }]);
      }, this.maxConcurrentRequests),
      toArray(),
    );
  }

  removePortAssociation(subsystem: { id: number }, port: NvmeOfPort): Observable<unknown> {
    return this.api.call('nvmet.port_subsys.query', [[['subsys_id', '=', subsystem.id], ['port_id', '=', port.id]]]).pipe(
      switchMap((connection) => {
        if (connection.length === 0) {
          return of(undefined);
        }

        return this.api.call('nvmet.port_subsys.delete', [connection[0].id]);
      }),
    );
  }

  associateHosts(subsystem: { id: number }, hosts: NvmeOfHost[]): Observable<unknown> {
    if (hosts.length === 0) {
      return of(undefined);
    }

    return from(hosts).pipe(
      mergeMap((host) => {
        return this.api.call('nvmet.host_subsys.create', [{ host_id: host.id, subsys_id: subsystem.id }]);
      }, this.maxConcurrentRequests),
      toArray(),
    );
  }

  removeHostAssociation(subsystem: { id: number }, host: NvmeOfHost): Observable<unknown> {
    return this.api.call('nvmet.host_subsys.query', [[['subsys_id', '=', subsystem.id], ['host_id', '=', host.id]]]).pipe(
      switchMap((connection) => {
        if (connection.length === 0) {
          return of(undefined);
        }

        return this.api.call('nvmet.host_subsys.delete', [connection[0].id]);
      }),
    );
  }

  updateSubsystem(subsystem: { id: number }, params: Partial<NvmeOfSubsystem>): Observable<NvmeOfSubsystem> {
    return this.api.call('nvmet.subsys.update', [subsystem.id, { ...params }]);
  }
}
