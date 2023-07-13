import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import {
  Observable, map, switchMap, tap,
} from 'rxjs';
import { NetworkInterfaceAliasType, NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { MemoryStatsEventData } from 'app/interfaces/events/memory-stats-event.interface';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { AllCpusUpdate, AllNetworkInterfacesUpdate, ReportingRealtimeUpdate } from 'app/interfaces/reporting.interface';
import { DashboardNetworkInterface, DashboardNetworkInterfaceAlias } from 'app/pages/dashboard/components/dashboard/dashboard.component';
import { WebSocketService } from 'app/services';

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

  constructor(
    private ws: WebSocketService,
  ) {
    super(initialState);
    this.initialize();
  }

  initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      tap(() => {
        this.patchState((state) => {
          return {
            ...state,
            isLoading: true,
          };
        });
      }),
      switchMap(() => this.getNetworkInterfaces()),
      switchMap(() => this.getResourceUsageUpdates()),
    );
  });

  private getNetworkInterfaces(): Observable<NetworkInterface[]> {
    return this.ws.call('interface.query').pipe(
      tap((interfaces) => {
        const clone = [...interfaces] as DashboardNetworkInterface[];
        const removeNics: { [nic: string]: number | string } = {};

        // Store keys for fast lookup
        const nicKeys: { [nic: string]: number | string } = {};
        interfaces.forEach((networkInterface, index) => {
          nicKeys[networkInterface.name] = index.toString();

          // Process Vlans (attach vlans to their parent)
          if (networkInterface.type !== NetworkInterfaceType.Vlan && !clone[index].state.vlans) {
            clone[index].state.vlans = [];
          }

          if (networkInterface.type === NetworkInterfaceType.Vlan && networkInterface.state.parent) {
            const parentIndex = parseInt(nicKeys[networkInterface.state.parent] as string);
            if (!clone[parentIndex].state.vlans) {
              clone[parentIndex].state.vlans = [];
            }

            clone[parentIndex].state.vlans.push(networkInterface.state);
            removeNics[networkInterface.name] = index;
          }

          // Process LAGGs
          if (networkInterface.type === NetworkInterfaceType.LinkAggregation) {
            clone[index].state.lagg_ports = networkInterface.lag_ports;
            networkInterface.lag_ports.forEach((nic) => {
              // Consolidate addresses
              clone[index].state.aliases.forEach((alias) => {
                (alias as DashboardNetworkInterfaceAlias).interface = nic;
              });
              clone[index].state.aliases = clone[index].state.aliases.concat(
                clone[nicKeys[nic] as number].state.aliases,
              );

              // Consolidate vlans
              clone[index].state.vlans.forEach((vlan) => { vlan.interface = nic; });
              clone[index].state.vlans = clone[index].state.vlans.concat(clone[nicKeys[nic] as number].state.vlans);

              // Mark interface for removal
              removeNics[nic] = nicKeys[nic];
            });
          }
        });

        // Remove NICs from list
        for (let i = clone.length - 1; i >= 0; i--) {
          if (removeNics[clone[i].name]) {
            // Remove
            clone.splice(i, 1);
          } else {
            // Only keep INET addresses
            clone[i].state.aliases = clone[i].state.aliases.filter((address) => {
              return [NetworkInterfaceAliasType.Inet, NetworkInterfaceAliasType.Inet6].includes(address.type);
            });
          }
        }

        // Update NICs array
        this.patchState((state) => {
          return {
            ...state,
            nics: clone,
          };
        });
      }),
    );
  }

  private getResourceUsageUpdates(): Observable<ReportingRealtimeUpdate> {
    return this.ws.subscribe('reporting.realtime').pipe(
      map((apiEvent) => apiEvent.fields),
      tap((update) => {
        if (update?.cpu) {
          this.patchState((state) => {
            return {
              ...state,
              cpuUsageUpdate: update.cpu,
            };
          });
        }
        if (update?.virtual_memory) {
          const memStats: MemoryStatsEventData = { ...update.virtual_memory };

          if (update.zfs && update.zfs.arc_size !== null) {
            memStats.arc_size = update.zfs.arc_size;
          }
          this.patchState((state) => {
            return {
              ...state,
              virtualMemoryUsage: memStats,
            };
          });
        }
        if (update?.interfaces) {
          this.patchState((state) => {
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
