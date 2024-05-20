import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import {
  dashboardWidget,
} from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetPoolNameSettingsComponent } from 'app/pages/dashboard/widgets/memory/widget-pool-name/widget-pool-name-settings/widget-pool-name-settings.component';
import { WidgetPoolNameComponent } from 'app/pages/dashboard/widgets/memory/widget-pool-name/widget-pool-name.component';

export interface WidgetPoolNameSettings {
  poolId?: string;
  interface?: string;
}

export const poolNameWidget = dashboardWidget<WidgetPoolNameSettings>({
  name: T('Pool'),
  supportedSizes: [SlotSize.Quarter, SlotSize.Half, SlotSize.Full],
  category: WidgetCategory.Memory,
  component: WidgetPoolNameComponent,
  settingsComponent: WidgetPoolNameSettingsComponent,
});
