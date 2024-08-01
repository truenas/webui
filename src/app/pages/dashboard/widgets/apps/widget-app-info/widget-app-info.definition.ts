import { Type } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { WidgetSettingsComponent, dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetAppInfoComponent } from 'app/pages/dashboard/widgets/apps/widget-app-info/widget-app-info.component';
import { WidgetAppSettingsComponent } from 'app/pages/dashboard/widgets/apps/widget-app-settings/widget-app-settings.component';

export const appInfoWidget = dashboardWidget({
  name: T('Application Information'),
  supportedSizes: [SlotSize.Half],
  category: WidgetCategory.Apps,
  component: WidgetAppInfoComponent,
  settingsComponent: WidgetAppSettingsComponent as Type<WidgetSettingsComponent>,
});
