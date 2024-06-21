import { Type } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import {
  WidgetSettingsComponent,
  dashboardWidget,
} from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetPoolSettingsComponent } from 'app/pages/dashboard/widgets/storage/widget-pool/widget-pool-settings/widget-pool-settings.component';
import { WidgetPoolComponent } from 'app/pages/dashboard/widgets/storage/widget-pool/widget-pool.component';

export interface WidgetPoolSettings {
  poolId: string;
}

export const poolWidget = dashboardWidget({
  name: T('Pool'),
  supportedSizes: [SlotSize.Full],
  category: WidgetCategory.Storage,
  component: WidgetPoolComponent,
  settingsComponent: WidgetPoolSettingsComponent as Type<WidgetSettingsComponent>,
});
