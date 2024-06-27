import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { WidgetVisibilityDepsType, dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetSysInfoPassiveComponent } from 'app/pages/dashboard/widgets/system/widget-sys-info-passive/widget-sys-info-passive.component';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

export const systemInfoPassiveWidget = dashboardWidget({
  name: T('System Information Standby Node'),
  supportedSizes: [SlotSize.Full],
  category: WidgetCategory.SystemInfo,
  component: WidgetSysInfoPassiveComponent,
  settingsComponent: null,
  visibility: {
    deps: [Store],
    isVisible$: (deps) => ((deps as WidgetVisibilityDepsType<Store>).get(Store)).select(selectIsHaLicensed),
  },
});
