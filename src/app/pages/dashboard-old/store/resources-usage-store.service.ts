import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import {
  Observable, map, switchMap, tap,
} from 'rxjs';
import { MemoryStatsEventData } from 'app/interfaces/events/memory-stats-event.interface';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { AllCpusUpdate, AllNetworkInterfacesUpdate, ReportingRealtimeUpdate } from 'app/interfaces/reporting.interface';
import { processNetworkInterfaces } from 'app/pages/dashboard/widgets/network/widget-interface/widget-interface.utils';
import { DashboardNetworkInterface } from 'app/pages/dashboard-old/components/dashboard/dashboard.component';
import { WebSocketService } from 'app/services/ws.service';

export interface ResourcesUsageState {
  cpuUsageUpdate: AllCpusUpdate;
  nics: DashboardNetworkInterface[];
  virtualMemoryUsage: MemoryStatsEventData;
  interfacesUsage: AllNetworkInterfacesUpdate;
  isLoading: boolean;
}

const initialState: ResourcesUsageState = {
  cpuUsageUpdate: null,
  nics: [],
  virtualMemoryUsage: null,
  interfacesUsage: {},
  isLoading: false,
};

@Injectable()
export class ResourcesUsageStore extends ComponentStore<ResourcesUsageState> {
  readonly cpuUsage$ = this.select((state) => state.cpuUsageUpdate);

  readonly virtualMemoryUsage$ = this.select((state) => state.virtualMemoryUsage);

  readonly nics$ = this.select((state) => state.nics);

  readonly interfacesUsage$ = this.select((state) => state.interfacesUsage);

  readonly isLoading$ = this.select((state) => state.isLoading);

  constructor(
    private ws: WebSocketService,
  ) {
    super(initialState);
    this.initialize();
  }

  initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      tap(() => {
        this.setState((state) => {
          return {
            ...state,
            isLoading: true,
          };
        });
      }),
      switchMap(() => this.getNetworkInterfaces()),
      tap(() => {
        this.setState((state) => {
          return {
            ...state,
            isLoading: false,
          };
        });
      }),
    );
  });

  private getNetworkInterfaces(): Observable<NetworkInterface[]> {
    return this.ws.call('interface.query').pipe(
      tap((interfaces) => {
        // Update NICs array
        this.setState((state) => {
          return {
            ...state,
            nics: processNetworkInterfaces(interfaces),
          };
        });
      }),
    );
  }

  getResourceUsageUpdates(): Observable<ReportingRealtimeUpdate> {
    return this.ws.subscribe('reporting.realtime').pipe(
      map((apiEvent) => apiEvent.fields),
      tap((update) => {
        if (update?.cpu) {
          this.setState((state) => {
            return {
              ...state,
              cpuUsageUpdate: update.cpu,
            };
          });
        }
        if (update?.virtual_memory) {
          const memStats: MemoryStatsEventData = { ...update.virtual_memory };

          if (update.zfs?.arc_size !== null) {
            memStats.arc_size = update.zfs.arc_size;
          }
          this.setState((state) => {
            return {
              ...state,
              virtualMemoryUsage: memStats,
            };
          });
        }
        if (update?.interfaces) {
          this.setState((state) => {
            return {
              ...state,
              interfacesUsage: {
                ...state.interfacesUsage,
                ...update.interfaces,
              },
            };
          });
        }
      }),
    );
  }
}
