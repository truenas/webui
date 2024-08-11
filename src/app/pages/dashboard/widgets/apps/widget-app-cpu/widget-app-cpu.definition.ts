import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetAppSettings } from 'app/pages/dashboard/widgets/apps/widget-app/widget-app.definition';
import { WidgetAppCpuComponent } from 'app/pages/dashboard/widgets/apps/widget-app-cpu/widget-app-cpu.component';
import { WidgetAppSettingsComponent } from 'app/pages/dashboard/widgets/apps/widget-app-settings/widget-app-settings.component';

export const appCpuWidget = dashboardWidget<WidgetAppSettings>({
  name: T('Application CPU Usage'),
  supportedSizes: [SlotSize.Quarter],
  category: WidgetCategory.Apps,
  component: WidgetAppCpuComponent,
  settingsComponent: WidgetAppSettingsComponent,
});
