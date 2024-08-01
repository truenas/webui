import { Type } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { WidgetSettingsComponent, dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetAppSettingsComponent } from 'app/pages/dashboard/widgets/apps/widget-app-settings/widget-app-settings.component';
import { WidgetAppStatsComponent } from 'app/pages/dashboard/widgets/apps/widget-app-stats/widget-app-stats.component';

export const appStatsWidget = dashboardWidget({
  name: T('Application Stats'),
  supportedSizes: [SlotSize.Half],
  category: WidgetCategory.Apps,
  component: WidgetAppStatsComponent,
  settingsComponent: WidgetAppSettingsComponent as Type<WidgetSettingsComponent>,
});
