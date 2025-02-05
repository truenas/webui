import { Injectable } from '@angular/core';
import {
  forkJoin, map, Observable, of, switchMap,
} from 'rxjs';
import { FibreChannelPort } from 'app/interfaces/fibre-channel.interface';
import { ApiService } from 'app/modules/websocket/api.service';

@Injectable({ providedIn: 'root' })
export class FibreChannelService {
  constructor(
    private api: ApiService,
  ) {}

  loadTargetPort(targetId: number): Observable<FibreChannelPort | undefined> {
    return this.api.call('fcport.query', [[['target.id', '=', targetId]]]).pipe(
      map((ports) => ports[0]),
    );
  }

  /**
   * Specifies the association between target and fiber channel.
   * @param targetId Target ID.
   * @param port Fiber channel port. May not be specified when hostId is present.
   * @param hostId Host ID. Must be specified to create a new virtual port when port is not specified.
   */
  linkFiberChannelToTarget(
    targetId: number,
    port: string,
    hostId?: number,
  ): Observable<FibreChannelPort | null | true> {
    const fcPort$ = hostId ? this.createNewPort(hostId) : of(port);

    return forkJoin([
      fcPort$,
      this.loadTargetPort(targetId),
    ]).pipe(
      switchMap(([desiredPort, existingPort]) => {
        const existingPortId = existingPort?.id || null;
        if (port === (existingPort?.port || null)) {
          return of(null);
        }
        if (port === null && existingPortId) {
          return this.api.call('fcport.delete', [existingPortId]);
        }

        const payload = { port: desiredPort, target_id: targetId };
        return existingPortId
          ? this.api.call('fcport.update', [existingPortId, payload])
          : this.api.call('fcport.create', [payload]);
      }),
    );
  }

  private createNewPort(hostId: number): Observable<string> {
    return this.api.call('fc.fc_host.query', [[['id', '=', hostId]]]).pipe(
      switchMap((hosts) => {
        const host = hosts[0];
        return this.api.call('fc.fc_host.update', [host.id, { npiv: host.npiv + 1 }]).pipe(
          map(() => `${host.alias}/${host.npiv + 1}`),
        );
      }),
    );
  }
}
