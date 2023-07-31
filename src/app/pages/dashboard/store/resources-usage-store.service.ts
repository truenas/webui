import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import _ from 'lodash';
import {
  Observable, map, switchMap, tap,
} from 'rxjs';
import { NetworkInterfaceAliasType, NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { MemoryStatsEventData } from 'app/interfaces/events/memory-stats-event.interface';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { AllCpusUpdate, AllNetworkInterfacesUpdate, ReportingRealtimeUpdate } from 'app/interfaces/reporting.interface';
import { DashboardNetworkInterface, DashboardNetworkInterfaceAlias } from 'app/pages/dashboard/components/dashboard/dashboard.component';
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
      switchMap(() => this.getResourceUsageUpdates()),
    );
  });

  private getNetworkInterfaces(): Observable<NetworkInterface[]> {
    return this.ws.call('interface.query').pipe(
      tap((interfaces) => {
        const dashboardNetworkInterfaces = [...interfaces] as DashboardNetworkInterface[];
        const removeNics: { [nic: string]: number | string } = {};

        // Store keys for fast lookup
        const nicKeys: { [nic: string]: number | string } = {};
        interfaces.forEach((networkInterface, index) => {
          nicKeys[networkInterface.name] = index.toString();

          // Process Vlans (attach vlans to their parent)
          if (networkInterface.type !== NetworkInterfaceType.Vlan && !dashboardNetworkInterfaces[index].state.vlans) {
            dashboardNetworkInterfaces[index].state.vlans = [];
          }

          if (networkInterface.type === NetworkInterfaceType.Vlan && networkInterface.state.parent) {
            const parentIndex = parseInt(nicKeys[networkInterface.state.parent] as string);
            if (!dashboardNetworkInterfaces[parentIndex].state.vlans) {
              dashboardNetworkInterfaces[parentIndex].state.vlans = [];
            }

            dashboardNetworkInterfaces[parentIndex].state.vlans.push(networkInterface.state);
            removeNics[networkInterface.name] = index;
          }

          // Process LAGGs
          if (networkInterface.type === NetworkInterfaceType.LinkAggregation) {
            dashboardNetworkInterfaces[index].state.lagg_ports = networkInterface.lag_ports;
            networkInterface.lag_ports.forEach((nic) => {
              // Consolidate addresses
              dashboardNetworkInterfaces[index].state.aliases.forEach((alias) => {
                (alias as DashboardNetworkInterfaceAlias).interface = nic;
              });
              dashboardNetworkInterfaces[index].state.aliases = dashboardNetworkInterfaces[index].state.aliases.concat(
                dashboardNetworkInterfaces[nicKeys[nic] as number].state.aliases,
              );

              // Consolidate vlans
              dashboardNetworkInterfaces[index].state.vlans.forEach((vlan) => { vlan.interface = nic; });
              dashboardNetworkInterfaces[index].state.vlans = dashboardNetworkInterfaces[index].state.vlans.concat(
                dashboardNetworkInterfaces[nicKeys[nic] as number].state.vlans,
              );

              // Mark interface for removal
              removeNics[nic] = nicKeys[nic];
            });
          }
        });

        // Remove NICs from list
        for (let i = dashboardNetworkInterfaces.length - 1; i >= 0; i--) {
          if (removeNics[dashboardNetworkInterfaces[i].name]) {
            // Remove
            dashboardNetworkInterfaces.splice(i, 1);
          } else {
            // Only keep INET addresses
            dashboardNetworkInterfaces[i].state.aliases = dashboardNetworkInterfaces[i].state.aliases.filter(
              (address) => {
                return [
                  NetworkInterfaceAliasType.Inet,
                  NetworkInterfaceAliasType.Inet6,
                ].includes(address.type);
              },
            );
          }
        }

        // Update NICs array
        this.setState((state) => {
          return {
            ...state,
            nics: _.cloneDeep(dashboardNetworkInterfaces),
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
