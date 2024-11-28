import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import {
  dashboardWidget,
} from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetPoolSettingsComponent } from 'app/pages/dashboard/widgets/storage/widget-pool/widget-pool-settings/widget-pool-settings.component';
import { WidgetPoolComponent } from 'app/pages/dashboard/widgets/storage/widget-pool/widget-pool.component';

export interface WidgetPoolSettings {
  poolId: string;
  name?: string;
}

export const poolWidget = dashboardWidget<WidgetPoolSettings>({
  name: T('Pool'),
  supportedSizes: [SlotSize.Full],
  category: WidgetCategory.Storage,
  component: WidgetPoolComponent,
  settingsComponent: WidgetPoolSettingsComponent,
});
