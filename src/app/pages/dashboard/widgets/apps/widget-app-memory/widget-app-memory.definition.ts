import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetAppSettings } from 'app/pages/dashboard/widgets/apps/widget-app/widget-app.definition';
import { WidgetAppMemoryComponent } from 'app/pages/dashboard/widgets/apps/widget-app-memory/widget-app-memory.component';
import { WidgetAppSettingsComponent } from 'app/pages/dashboard/widgets/apps/widget-app-settings/widget-app-settings.component';

export const appMemoryWidget = dashboardWidget<WidgetAppSettings>({
  name: T('Application Memory'),
  supportedSizes: [SlotSize.Quarter],
  category: WidgetCategory.Apps,
  component: WidgetAppMemoryComponent,
  settingsComponent: WidgetAppSettingsComponent,
});
