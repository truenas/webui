import { computed, Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import {
  combineLatest, switchMap, tap,
} from 'rxjs';
import {
  NvmeOfNamespace, NvmeOfSubsystem, SubsystemHostAssociation, SubsystemPortAssociation,
} from 'app/interfaces/nvme-of.interface';
import { ApiService } from 'app/modules/websocket/api.service';

export interface NvmeOfState {
  subsystems: NvmeOfSubsystem[];
  namespaces: NvmeOfNamespace[];
  hostSubsystems: SubsystemHostAssociation[];
  ports: SubsystemPortAssociation[];
  isLoading: boolean;
}

const initialState: NvmeOfState = {
  subsystems: [],
  namespaces: [],
  hostSubsystems: [],
  ports: [],
  isLoading: false,
};

@Injectable()
export class NvmeOfStore extends ComponentStore<NvmeOfState> {
  readonly subsystems = computed(() => this.state().subsystems);

  readonly isLoading = computed(() => this.state().isLoading);

  constructor(private api: ApiService) {
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
        this.api.call('nvmet.subsys.query'),
        this.api.call('nvmet.namespace.query'),
        this.api.call('nvmet.host_subsys.query'),
        this.api.call('nvmet.port_subsys.query'),
      ])),
      tap(([
        subsystems,
        namespaces,
        hostSubsystems,
        ports,
      ]: [NvmeOfSubsystem[], NvmeOfNamespace[], SubsystemHostAssociation[], SubsystemPortAssociation[]]) => {
        this.patchState({
          subsystems,
          namespaces,
          hostSubsystems,
          ports,
          isLoading: false,
        });
      }),
    );
  });

  getSubsystemNamespaces(subsystem: NvmeOfSubsystem): NvmeOfNamespace[] {
    const { namespaces } = this.state();
    return namespaces.filter((namespace) => namespace.subsystem.id === subsystem.id);
  }

  getSubsystemHosts(subsystem: NvmeOfSubsystem): SubsystemHostAssociation[] {
    const { hostSubsystems } = this.state();
    return hostSubsystems.filter((host) => host.subsystem.id === subsystem.id);
  }

  getSubsystemPorts(subsystem: NvmeOfSubsystem): SubsystemPortAssociation[] {
    const { ports } = this.state();
    return ports.filter((port) => port.subsystem.id === subsystem.id);
  }
}
