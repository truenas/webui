import { Type } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import {
  WidgetSettingsComponent,
  dashboardWidget,
} from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetPoolSettingsComponent } from 'app/pages/dashboard/widgets/storage/widget-pool/widget-pool-settings/widget-pool-settings.component';
import { WidgetPoolLastScanErrorsComponent } from 'app/pages/dashboard/widgets/storage/widget-pool-last-scan-errors/widget-pool-scan-errors.component';

export interface WidgetPoolSettings {
  poolId: string;
}

export const poolLastScanErrorsWidget = dashboardWidget({
  name: T('Last Scan Errors'),
  supportedSizes: [SlotSize.Quarter],
  category: WidgetCategory.Storage,
  component: WidgetPoolLastScanErrorsComponent,
  settingsComponent: WidgetPoolSettingsComponent as Type<WidgetSettingsComponent>,
});
