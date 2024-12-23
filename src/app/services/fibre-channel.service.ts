import { Injectable } from '@angular/core';
import {
  forkJoin, map, Observable, of, switchMap,
} from 'rxjs';
import { FibreChannelPort } from 'app/interfaces/fibre-channel.interface';
import { nullOption, skipOption } from 'app/interfaces/option.interface';
import { ApiService } from 'app/services/websocket/api.service';

@Injectable({ providedIn: 'root' })
export class FibreChannelService {
  constructor(
    private api: ApiService,
  ) {}

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
      this.api.call('fcport.query', [[['target.id', '=', targetId]]]),
    ]).pipe(
      switchMap(([fcPort, fcPorts]) => {
        const fcPortId = fcPorts[0]?.id || null;
        if (port === skipOption) {
          return of(null);
        }
        if (port === nullOption && fcPortId) {
          return this.api.call('fcport.delete', [fcPortId]);
        }

        const payload = { port: fcPort, target_id: targetId };
        return fcPortId
          ? this.api.call('fcport.update', [fcPortId, payload])
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
