import { computed, Injectable, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  forkJoin, map, pipe, switchMap, tap,
} from 'rxjs';
import {
  NvmeOfHost, NvmeOfNamespace, NvmeOfPort, NvmeOfSubsystem,
  NvmeOfSubsystemDetails, toNvmeOfHost, toNvmeOfNamespace, toNvmeOfPort, toNvmeOfSubsystem,
} from 'app/interfaces/nvme-of.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface NvmeOfState {
  subsystems: NvmeOfSubsystem[];
  namespaces: NvmeOfNamespace[];
  hosts: NvmeOfHost[];
  ports: NvmeOfPort[];
  isLoading: boolean;
}

const initialState: NvmeOfState = {
  subsystems: [],
  namespaces: [],
  hosts: [],
  ports: [],
  isLoading: false,
};

@Injectable({
  providedIn: 'root',
})
export class NvmeOfStore {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);

  private readonly state = signalState(initialState);

  readonly subsystems = computed((): NvmeOfSubsystemDetails[] => {
    const hosts = this.state.hosts();
    const ports = this.state.ports();
    const namespaces = this.state.namespaces();

    return this.state.subsystems().map((subsystem) => ({
      ...subsystem,
      hosts: hosts.filter((host) => subsystem.hosts?.includes(host.id)),
      ports: ports.filter((port) => subsystem.ports?.includes(port.id)),
      namespaces: namespaces.filter((namespace) => subsystem.namespaces?.includes(namespace.id)),
    }));
  });

  readonly ports = this.state.ports;
  readonly namespaces = this.state.namespaces;
  readonly hosts = this.state.hosts;
  readonly isLoading = this.state.isLoading;

  readonly initialize = rxMethod<void>(pipe(
    tap(() => patchState(this.state, { isLoading: true })),
    switchMap(() => forkJoin([
      this.api.query('nvmet.subsys.query', [], { extra: { verbose: true } }).pipe(
        map((subsystems) => subsystems.map(toNvmeOfSubsystem)),
      ),
      this.api.query('nvmet.namespace.query').pipe(map((namespaces) => namespaces.map(toNvmeOfNamespace))),
      this.api.query('nvmet.host.query').pipe(map((hosts) => hosts.map(toNvmeOfHost))),
      this.api.query('nvmet.port.query').pipe(map((ports) => ports.map(toNvmeOfPort))),
    ]).pipe(
      tapResponse({
        next: ([subsystems, namespaces, hosts, ports]) => {
          patchState(this.state, {
            subsystems, namespaces, hosts, ports,
          });
        },
        error: (error: unknown) => this.errorHandler.showErrorModal(error),
        finalize: () => patchState(this.state, { isLoading: false }),
      }),
    )),
  ));

  readonly reloadPorts = rxMethod<void>(pipe(
    switchMap(() => this.api.query('nvmet.port.query').pipe(
      tapResponse({
        next: (ports) => patchState(this.state, { ports: ports.map(toNvmeOfPort) }),
        error: (error: unknown) => this.errorHandler.showErrorModal(error),
      }),
    )),
  ));

  readonly reloadHosts = rxMethod<void>(pipe(
    switchMap(() => this.api.query('nvmet.host.query').pipe(
      tapResponse({
        next: (hosts) => patchState(this.state, { hosts: hosts.map(toNvmeOfHost) }),
        error: (error: unknown) => this.errorHandler.showErrorModal(error),
      }),
    )),
  ));
}
