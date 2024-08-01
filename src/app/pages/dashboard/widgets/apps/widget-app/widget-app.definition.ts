import { Type } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { WidgetSettingsComponent, dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetAppComponent } from 'app/pages/dashboard/widgets/apps/widget-app/widget-app.component';
import { WidgetAppSettingsComponent } from 'app/pages/dashboard/widgets/apps/widget-app-settings/widget-app-settings.component';

export interface WidgetAppSettings {
  appName: string;
}

// TODO: dashboard<WidgetAppSettings> does not work
export const appWidget = dashboardWidget({
  name: T('Application'),
  supportedSizes: [SlotSize.Full],
  category: WidgetCategory.Apps,
  component: WidgetAppComponent,
  settingsComponent: WidgetAppSettingsComponent as Type<WidgetSettingsComponent>,
});
