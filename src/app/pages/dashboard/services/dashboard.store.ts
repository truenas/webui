import { Injectable } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import {
  EMPTY,
  Observable, catchError, filter, finalize, map, switchMap, tap,
} from 'rxjs';
import { WidgetName } from 'app/enums/widget-name.enum';
import { demoWidgets } from 'app/pages/dashboard/services/demo-widgets.constant';
import { WidgetGroup, WidgetGroupLayout } from 'app/pages/dashboard/types/widget-group.interface';
import { SomeWidgetSettings, WidgetType } from 'app/pages/dashboard/types/widget.interface';
import { AuthService } from 'app/services/auth/auth.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

// we have external `DashConfigItem` in old dashboard, but it will be removed once we go ahead with new dashboard
export interface OldDashboardConfigItem {
  name: WidgetName;
  identifier?: string;
}

export interface DashboardState {
  isLoading: boolean;
  globalError: string;

  /**
   * Ordered.
   */
  groups: WidgetGroup[];
}

export const initialState: DashboardState = {
  isLoading: false,
  globalError: '',
  groups: [],
};

/**
 * This store ONLY manages loading and saving of the dashboard to/from user settings.
 * It does not know or care about data used inside the widgets.
 * It also doesn't care about edit mode.
 */
@UntilDestroy()
@Injectable()
export class DashboardStore extends ComponentStore<DashboardState> {
  readonly isLoading$ = this.select((state) => state.isLoading);
  readonly groups$ = this.select((state) => state.groups);

  constructor(
    private authService: AuthService,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
  ) {
    super(initialState);
  }

  readonly entered = this.effect((trigger$) => {
    return trigger$.pipe(
      tap(() => this.toggleLoadingState(true)),
      switchMap(() => this.authService.refreshUser()),
      switchMap(() => this.authService.user$.pipe(
        filter(Boolean),
        map((user) => user.attributes.dashState),
      )),
      tap((dashState) => {
        // TODO: Convert demoWidgets into default template
        this.setState({
          isLoading: false,
          globalError: '',
          groups: this.getDashboardGroups(dashState || demoWidgets),
        });
      }),
      catchError((error) => {
        this.handleError(error);
        return EMPTY;
      }),
    );
  });

  save(groups: WidgetGroup[]): Observable<void> {
    this.toggleLoadingState(true);

    return this.ws.call('auth.set_attribute', ['dashState', groups]).pipe(
      switchMap(() => this.authService.refreshUser()),
      finalize(() => this.toggleLoadingState(false)),
    );
  }

  handleError(error: unknown): void {
    this.errorHandler.showErrorModal(error);
    this.toggleLoadingState(false);
  }

  toggleLoadingState(isLoading: boolean): void {
    this.patchState((state) => ({ ...state, isLoading }));
  }

  private getDashboardGroups(dashState: WidgetGroup[] | OldDashboardConfigItem[]): WidgetGroup[] {
    return dashState.map((widget) => {
      if (!widget.hasOwnProperty('layout')) {
        const oldDashboardWidget = widget as unknown as OldDashboardConfigItem;
        return {
          layout: WidgetGroupLayout.Full,
          slots: [{
            type: this.getWidgetTypeFromOldDashboard(oldDashboardWidget.name),
            settings: this.extractSettings(oldDashboardWidget),
          }],
        };
      }

      return widget as WidgetGroup;
    });
  }

  private getWidgetTypeFromOldDashboard(name: WidgetName): WidgetType {
    switch (name) {
      case WidgetName.Help: return WidgetType.Help;
      case WidgetName.Memory: return WidgetType.Memory;
      case WidgetName.Interface: return WidgetType.Ipv4Address;
      case WidgetName.SystemInformation: return WidgetType.SystemInfoActive;
      case WidgetName.SystemInformationStandby: return WidgetType.SystemInfoPassive;
      case WidgetName.Network: return WidgetType.Network;
      case WidgetName.Backup: return WidgetType.BackupTasks;
      case WidgetName.Cpu: return WidgetType.Cpu;
      case WidgetName.Pool: return WidgetType.PoolName;
      case WidgetName.Storage: return WidgetType.Storage;
      default: return name as unknown as WidgetType;
    }
  }

  private extractSettings(widget: OldDashboardConfigItem): SomeWidgetSettings {
    if (widget.identifier) {
      const [key, value] = widget.identifier.split(',');

      if (widget.name === WidgetName.Interface) {
        return { interface: value };
      }

      return { [key]: value };
    }
    return {};
  }
}
