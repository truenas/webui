import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import {
  dashboardWidget, WidgetVisibilityDepsType,
} from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import {
  WidgetHostnamePassiveComponent,
} from 'app/pages/dashboard/widgets/system/widget-hostname-passive/widget-hostname-passive.component';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

export const hostnamePassiveWidget = dashboardWidget({
  name: T('Hostname – Passive'),
  supportedSizes: [SlotSize.Quarter, SlotSize.Half, SlotSize.Full],
  category: WidgetCategory.SystemInfo,
  component: WidgetHostnamePassiveComponent,
  settingsComponent: null,
  visibility: {
    deps: [Store],
    isVisible$: (deps) => {
      const store$ = (deps as WidgetVisibilityDepsType<Store>).get(Store);
      if (!store$) {
        return of(false);
      }

      return store$.select(selectIsHaLicensed);
    },
  },
});
