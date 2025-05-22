import { computed, Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { tapResponse } from '@ngrx/operators';
import { forkJoin, switchMap, tap } from 'rxjs';
import {
  NvmeOfHost, NvmeOfNamespace, NvmeOfPort, NvmeOfSubsystem,
  NvmeOfSubsystemDetails,
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
export class NvmeOfStore extends ComponentStore<NvmeOfState> {
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

  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
  ) {
    super(initialState);
  }

  initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      tap(() => {
        this.patchState({
          ...initialState,
          isLoading: true,
        });
      }),
      switchMap(() => {
        return forkJoin([
          this.api.call('nvmet.subsys.query', [[], { extra: { verbose: true } }]),
          this.api.call('nvmet.namespace.query'),
          this.api.call('nvmet.host.query'),
          this.api.call('nvmet.port.query'),
        ]).pipe(
          tapResponse(
            ([
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
            (error: unknown) => {
              this.errorHandler.showErrorModal(error);

              this.patchState({
                isLoading: false,
              });
            },
          ),
        );
      }),
    );
  });

  reloadPorts = this.effect((trigger$) => {
    return trigger$.pipe(
      switchMap(() => {
        return this.api.call('nvmet.port.query').pipe(
          this.errorHandler.withErrorHandler(),
          tap((ports) => this.patchState({ ports })),
        );
      }),
    );
  });
}
