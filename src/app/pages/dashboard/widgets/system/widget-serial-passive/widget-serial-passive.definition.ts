import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import {
  dashboardWidget, WidgetVisibilityDepsType,
} from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import {
  WidgetSerialPassiveComponent,
} from 'app/pages/dashboard/widgets/system/widget-serial-passive/widget-serial-passive.component';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

export const serialPassiveWidget = dashboardWidget({
  name: T('Serial – Passive'),
  supportedSizes: [SlotSize.Quarter, SlotSize.Half, SlotSize.Full],
  category: WidgetCategory.SystemInfo,
  component: WidgetSerialPassiveComponent,
  settingsComponent: null,
  visibility: {
    deps: [Store],
    isVisible$: (deps) => ((deps as WidgetVisibilityDepsType<Store>).get(Store)).select(selectIsHaLicensed),
  },
});
