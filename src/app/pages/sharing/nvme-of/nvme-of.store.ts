import { computed, Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import {
  combineLatest, switchMap, tap,
} from 'rxjs';
import {
  NvmeOfNamespace, NvmeOfSubsystem, NvmeOfSubsystemDetails, SubsystemHostAssociation, SubsystemPortAssociation,
} from 'app/interfaces/nvme-of.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface NvmeOfState {
  subsystems: NvmeOfSubsystem[];
  namespaces: NvmeOfNamespace[];
  subsystemsHosts: SubsystemHostAssociation[];
  subsystemPorts: SubsystemPortAssociation[];
  isLoading: boolean;
}

const initialState: NvmeOfState = {
  subsystems: [],
  namespaces: [],
  subsystemsHosts: [],
  subsystemPorts: [],
  isLoading: false,
};

@Injectable()
export class NvmeOfStore extends ComponentStore<NvmeOfState> {
  readonly subsystems = computed((): NvmeOfSubsystemDetails[] => {
    const state = this.state();
    return state.subsystems.map((subsystem: NvmeOfSubsystemDetails) => {
      subsystem.hosts = state.subsystemsHosts.filter((host) => host.subsystem.id === subsystem.id);
      subsystem.ports = state.subsystemPorts.filter((port) => port.subsystem.id === subsystem.id);
      subsystem.namespaces = state.namespaces.filter((namespace) => namespace.subsystem.id === subsystem.id);
      return subsystem;
    });
  });

  readonly isLoading = computed(() => this.state().isLoading);

  constructor(private api: ApiService, private errorHandler: ErrorHandlerService) {
    super(initialState);
    this.initialize();
  }

  initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      tap(() => {
        this.patchState({
          ...initialState,
          isLoading: true,
        });
      }),
      switchMap(() => combineLatest([
        this.api.call('nvmet.subsys.query').pipe(
          this.errorHandler.withErrorHandler(),
        ),
        this.api.call('nvmet.namespace.query').pipe(
          this.errorHandler.withErrorHandler(),
        ),
        this.api.call('nvmet.host_subsys.query').pipe(
          this.errorHandler.withErrorHandler(),
        ),
        this.api.call('nvmet.port_subsys.query').pipe(
          this.errorHandler.withErrorHandler(),
        ),
      ])),
      tap(([
        subsystems,
        namespaces,
        hostSubsystems,
        subsystemPorts,
      ]: [NvmeOfSubsystem[], NvmeOfNamespace[], SubsystemHostAssociation[], SubsystemPortAssociation[]]) => {
        this.patchState({
          subsystems,
          namespaces,
          subsystemsHosts: hostSubsystems,
          subsystemPorts,
          isLoading: false,
        });
      }),
    );
  });
}
