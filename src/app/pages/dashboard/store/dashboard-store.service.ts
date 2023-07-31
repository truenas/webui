import { Injectable } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { Store, select } from '@ngrx/store';
import _ from 'lodash';
import {
  Observable, combineLatest, filter, switchMap, takeWhile, tap,
} from 'rxjs';
import { SystemFeatures, SystemInfoWithFeatures } from 'app/interfaces/events/sys-info-event.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { VolumesData } from 'app/interfaces/volume-data.interface';
import { DashboardNetworkInterface, WidgetName } from 'app/pages/dashboard/components/dashboard/dashboard.component';
import { DashConfigItem } from 'app/pages/dashboard/components/widget-controller/widget-controller.component';
import { DashboardStorageStore } from 'app/pages/dashboard/store/dashboard-storage-store.service';
import { ResourcesUsageStore } from 'app/pages/dashboard/store/resources-usage-store.service';
import { deepCloneState } from 'app/pages/dashboard/utils/deep-clone-state.helper';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { PreferencesState } from 'app/store/preferences/preferences.reducer';
import { selectPreferencesState } from 'app/store/preferences/preferences.selectors';
import { waitForSystemFeatures, waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

export interface DashboardState {
  isLoading: boolean;
  sysInfoWithFeatures: SystemInfoWithFeatures;
  dashboardState: DashConfigItem[];
  pools: Pool[];
  volumesData: VolumesData;
  isHaLicensed: boolean;
  nics: DashboardNetworkInterface[];
  availableWidgets: DashConfigItem[];
}

const initialState: DashboardState = {
  isLoading: false,
  sysInfoWithFeatures: null,
  dashboardState: null,
  pools: null,
  volumesData: null,
  nics: null,
  isHaLicensed: false,
  availableWidgets: null,
};

@UntilDestroy()
@Injectable()
export class DashboardStore extends ComponentStore<DashboardState> {
  readonly isLoading$ = this.select((state) => state.isLoading);

  constructor(
    private store$: Store<AppState>,
    private resourceStorageStore$: ResourcesUsageStore,
    private dashboardStorageStore$: DashboardStorageStore,
  ) {
    super(initialState);
    this.initialize();
  }

  initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      tap(() => this.setState((state: DashboardState): DashboardState => {
        return {
          ...state,
          isLoading: true,
        };
      })),
      switchMap(() => combineLatest([
        this.getSystemInfoWithFeatures(),
        this.getStorageData(),
        this.getHaLicenseInfo(),
        this.getNicsInfo(),
      ])),
      switchMap(() => this.loadDashboardState()),
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

  private getSystemInfoWithFeatures(): Observable<unknown> {
    return this.store$.pipe(
      waitForSystemInfo,
      tap((sysInfo: SystemInfo) => {
        this.setState((state) => {
          return {
            ...state,
            sysInfoWithFeatures: sysInfo as unknown as SystemInfoWithFeatures,
          };
        });
      }),
      switchMap(() => this.store$.pipe(
        waitForSystemFeatures,
      )),
      deepCloneState(),
      tap((systemFeatures: SystemFeatures) => {
        this.setState((state) => {
          return {
            ...state,
            sysInfoWithFeatures: {
              ...state.sysInfoWithFeatures,
              features: systemFeatures,
            },
          };
        });
      }),
    );
  }

  private loadDashboardState(): Observable<unknown> {
    this.generateDefaultConfig();
    return this.store$.pipe(
      select(selectPreferencesState),
      filter(Boolean),
      takeWhile((prefs) => !prefs.dashboardState, true),
      tap((prefs: PreferencesState) => {
        if (!prefs.dashboardState) {
          this.setState((state) => {
            return {
              ...state,
              dashboardState: this.sanitizeState(_.cloneDeep(state.availableWidgets), state.pools, state.nics),
            };
          });
          return;
        }
        this.applyState(prefs.dashboardState);
      }),
    );
  }

  private getStorageData(): Observable<unknown> {
    return this.dashboardStorageStore$.isLoading$.pipe(
      filter((isLoading) => !isLoading),
      switchMap(() => {
        return combineLatest([
          this.dashboardStorageStore$.pools$,
          this.dashboardStorageStore$.volumesData$,
        ]);
      }),
      deepCloneState(),
      tap(([pools, volumesData]: [Pool[], VolumesData]) => {
        this.setState((state: DashboardState): DashboardState => {
          return {
            ...state,
            pools,
            volumesData,
          };
        });
      }),
    );
  }

  private getHaLicenseInfo(): Observable<unknown> {
    return this.store$.select(selectIsHaLicensed).pipe(
      tap((isHaLiecnsed: boolean) => {
        this.setState((state: DashboardState): DashboardState => {
          return {
            ...state,
            isHaLicensed: isHaLiecnsed,
          };
        });
      }),
    );
  }

  private getNicsInfo(): Observable<unknown> {
    return this.resourceStorageStore$.isLoading$.pipe(
      filter((isLoading) => !isLoading),
      deepCloneState(),
      switchMap(() => this.resourceStorageStore$.nics$),
      tap((nics: DashboardNetworkInterface[]) => {
        this.setState((state: DashboardState): DashboardState => {
          return {
            ...state,
            nics,
          };
        });
      }),
    );
  }

  private generateDefaultConfig(): void {
    this.setState((state: DashboardState): DashboardState => {
      const conf: DashConfigItem[] = [
        {
          name: WidgetName.SystemInformation,
          rendered: true,
          id: '0',
        },
      ];
      if (state.isHaLicensed) {
        conf.push({
          id: conf.length.toString(),
          name: WidgetName.SystemInformationStandby,
          identifier: 'passive,true',
          rendered: true,
        });
      }

      conf.push({ name: WidgetName.Help, rendered: true });
      conf.push({ name: WidgetName.Cpu, rendered: true, id: conf.length.toString() });
      conf.push({ name: WidgetName.Memory, rendered: true, id: conf.length.toString() });
      conf.push({ name: WidgetName.Storage, rendered: true, id: conf.length.toString() });
      conf.push({ name: WidgetName.Network, rendered: true, id: conf.length.toString() });

      state.pools?.forEach((pool) => {
        conf.push({
          id: conf.length.toString(),
          name: WidgetName.Pool,
          identifier: `name,Pool:${pool.name}`,
          rendered: false,
        });
      });

      state.nics?.forEach((nic) => {
        conf.push({
          id: conf.length.toString(),
          name: WidgetName.Interface,
          identifier: `name,${nic.name}`,
          rendered: false,
        });
      });
      return {
        ...state,
        availableWidgets: _.cloneDeep(conf),
        dashboardState: state.dashboardState
          ? state.dashboardState
          : this.sanitizeState(_.cloneDeep(conf), state.pools, state.nics),
      };
    });
  }

  private sanitizeState(
    dashboardState: DashConfigItem[],
    pools: Pool[],
    nics: DashboardNetworkInterface[],
  ): DashConfigItem[] {
    return dashboardState?.filter((widget) => {
      if ([WidgetName.Cpu, WidgetName.Memory].includes(widget.name)) {
        return true;
      }

      if (widget.name === WidgetName.Storage) {
        return !!pools?.length;
      }

      if (widget.name === WidgetName.Pool) {
        const key: string = widget.identifier.split(',')[0] as keyof Pool;
        const value: string = widget.identifier.split(',')[1];
        const dashboardPool = pools.find((pool) => pool[key as keyof Pool] === value.split(':')[1]);
        return !!dashboardPool;
      }

      if (widget.name === WidgetName.Interface) {
        const key: string = widget.identifier.split(',')[0] as keyof Pool;
        const value: string = widget.identifier.split(',')[1];
        const nicsCopy = nics.filter((nic) => nic[key as keyof DashboardNetworkInterface] === value);
        return !!nicsCopy?.length;
      }
      return true;
    });
  }

  private applyState(newState: DashConfigItem[]): void {
    // This reconciles current state with saved dashState
    this.setState((state) => {
      if (!state.dashboardState) {
        return {
          ...state,
        };
      }

      let hiddenItems: DashConfigItem[] = [];
      for (const widget of state.dashboardState) {
        let widgetExistsInNewState = false;
        for (const newWidget of newState) {
          if (widget.identifier) {
            if (widget.identifier === newWidget.identifier) {
              widgetExistsInNewState = true;
            }
          } else if (widget.name === newWidget.name) {
            widgetExistsInNewState = true;
          }
        }
        if (!widgetExistsInNewState) {
          hiddenItems.push(_.cloneDeep(widget));
        }
      }

      hiddenItems = hiddenItems.map((widget) => ({ ...widget, rendered: false }));

      return {
        ...state,
        dashboardState: this.sanitizeState(_.cloneDeep([...newState, ...hiddenItems]), state.pools, state.nics),
      };
    });
  }
}
