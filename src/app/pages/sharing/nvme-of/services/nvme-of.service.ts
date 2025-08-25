import { Injectable, inject } from '@angular/core';
import {
  combineLatest,
  from, mergeMap, Observable, of, switchMap, tap, toArray,
} from 'rxjs';
import { map, take } from 'rxjs/operators';
import { NvmeOfTransportType } from 'app/enums/nvme-of.enum';
import { RdmaProtocolName } from 'app/enums/service-name.enum';
import { NvmeOfHost, NvmeOfPort, NvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { LicenseService } from 'app/services/license.service';

@Injectable({
  providedIn: 'root',
})
export class NvmeOfService {
  private api = inject(ApiService);
  private license = inject(LicenseService);

  private maxConcurrentRequests = 15;

  private cachedRdmaCapable: boolean | null = null;

  getSupportedTransports(): Observable<NvmeOfTransportType[]> {
    return combineLatest([
      this.license.hasFibreChannel$,
      this.isRdmaCapable(),
    ])
      .pipe(
        map(([hasFibreChannel, isRdmaCapable]) => {
          const transports = [NvmeOfTransportType.Tcp];

          if (hasFibreChannel) {
            transports.push(NvmeOfTransportType.FibreChannel);
          }

          if (isRdmaCapable) {
            transports.push(NvmeOfTransportType.Rdma);
          }

          return transports;
        }),
        take(1),
      );
  }

  isRdmaCapable(): Observable<boolean> {
    if (this.cachedRdmaCapable === null) {
      return this.api.call('rdma.capable_protocols').pipe(
        map((protocols) => protocols.includes(RdmaProtocolName.Nvmet)),
        tap((rdmaCapable) => {
          this.cachedRdmaCapable = rdmaCapable;
        }),
      );
    }

    return of(this.cachedRdmaCapable);
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
