import { Injectable } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { WidgetGroup } from 'app/pages/dashboard/types/widget-group.interface';

export interface DashboardState {
  isLoading: boolean;
  globalError: string;

  /**
   * Ordered.
   */
  groups: WidgetGroup[];
}

/**
 * This store ONLY manages loading and saving of the dashboard to/from user settings.
 * It does not know or care about data used inside the widgets.
 * It also doesn't care about edit mode.
 */
@UntilDestroy()
@Injectable()
export class DashboardStore extends ComponentStore<DashboardState> {
  readonly isLoading$ = this.select((state) => state.isLoading);

  readonly entered = this.effect((trigger$) => {
    // TODO: Load data from user attributes.
    // TODO: Set isLoading flag, but do not clear previous state.
    // TODO: If it's in old format, migrate to new format.
    // TODO: Handle global errors like something network errors or something completely unexpected in user attributes.
    return trigger$;
  });

  readonly save = this.effect<WidgetGroup[]>((groups$) => {
    // TODO: Save to user settings.
    return groups$;
  });
}
