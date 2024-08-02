import { Type } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { WidgetSettingsComponent, dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetAppCpuComponent } from 'app/pages/dashboard/widgets/apps/widget-app-cpu/widget-app-cpu.component';
import { WidgetAppSettingsComponent } from 'app/pages/dashboard/widgets/apps/widget-app-settings/widget-app-settings.component';

export const appCpuWidget = dashboardWidget({
  name: T('Application CPU Usage'),
  supportedSizes: [SlotSize.Quarter],
  category: WidgetCategory.Apps,
  component: WidgetAppCpuComponent,
  settingsComponent: WidgetAppSettingsComponent as Type<WidgetSettingsComponent>,
});
