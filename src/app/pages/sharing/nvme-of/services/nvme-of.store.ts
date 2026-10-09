import { computed, Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { tapResponse } from '@ngrx/operators';
import {
  forkJoin, map, switchMap, tap,
} from 'rxjs';
import {
  NvmeOfHost, NvmeOfNamespace, NvmeOfPort, NvmeOfSubsystem,
  NvmeOfSubsystemDetails, toNvmeOfHost, toNvmeOfNamespace, toNvmeOfPort, toNvmeOfSubsystem,
} from 'app/interfaces/nvme-of.interface';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
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
export class NvmeOfStore extends ComponentStore<NvmeOfState> {
  private api = inject(TypedApiService);
  private errorHandler = inject(ErrorHandlerService);

  readonly subsystems = computed((): NvmeOfSubsystemDetails[] => {
    const state = this.state();
    return state.subsystems.map((subsystem) => {
      return {
        ...subsystem,
        hosts: state.hosts?.filter((host) => subsystem.hosts?.includes(host.id)) || [],
        ports: state.ports?.filter((port) => subsystem.ports?.includes(port.id)) || [],
        namespaces: state.namespaces?.filter((namespace) => subsystem.namespaces?.includes(namespace.id)) || [],
      };
    });
  });

  readonly ports = computed(() => this.state().ports);
  readonly namespaces = computed(() => this.state().namespaces);
  readonly hosts = computed(() => this.state().hosts);

  readonly isLoading = computed(() => this.state().isLoading);

  constructor() {
    super(initialState);
  }

  initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      tap(() => {
        this.patchState({ isLoading: true });
      }),
      switchMap(() => {
        return forkJoin([
          this.api.query('nvmet.subsys.query', [], { extra: { verbose: true } }).pipe(
            map((subsystems) => subsystems.map(toNvmeOfSubsystem)),
          ),
          this.api.query('nvmet.namespace.query').pipe(map((namespaces) => namespaces.map(toNvmeOfNamespace))),
          this.api.query('nvmet.host.query').pipe(map((hosts) => hosts.map(toNvmeOfHost))),
          this.api.query('nvmet.port.query').pipe(map((ports) => ports.map(toNvmeOfPort))),
        ]).pipe(
          tapResponse({
            next: ([
              subsystems,
              namespaces,
              hosts,
              ports,
            ]: [NvmeOfSubsystem[], NvmeOfNamespace[], NvmeOfHost[], NvmeOfPort[]]) => {
              this.patchState({
                subsystems,
                namespaces,
                hosts,
                ports,
                isLoading: false,
              });
            },
            error: (error: unknown) => {
              this.errorHandler.showErrorModal(error);

              this.patchState({
                isLoading: false,
              });
            },
          }),
        );
      }),
    );
  });

  reloadPorts = this.effect((trigger$) => {
    return trigger$.pipe(
      switchMap(() => {
        return this.api.query('nvmet.port.query').pipe(
          this.errorHandler.withErrorHandler(),
          tap((ports) => this.patchState({ ports: ports.map(toNvmeOfPort) })),
        );
      }),
    );
  });

  reloadHosts = this.effect((trigger$) => {
    return trigger$.pipe(
      switchMap(() => {
        return this.api.query('nvmet.host.query').pipe(
          this.errorHandler.withErrorHandler(),
          tap((hosts) => this.patchState({ hosts: hosts.map(toNvmeOfHost) })),
        );
      }),
    );
  });
}
