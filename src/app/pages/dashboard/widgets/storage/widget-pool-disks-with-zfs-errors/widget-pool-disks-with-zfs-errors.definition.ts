import { Type } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import {
  WidgetSettingsComponent,
  dashboardWidget,
} from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetPoolSettingsComponent } from 'app/pages/dashboard/widgets/storage/widget-pool/widget-pool-settings/widget-pool-settings.component';
import { WidgetDisksWithZfsErrorsComponent } from 'app/pages/dashboard/widgets/storage/widget-pool-disks-with-zfs-errors/widget-pool-disks-with-zfs-errors.component';

export interface WidgetPoolSettings {
  poolId: string;
}

export const poolDisksWithZfsErrorsWidget = dashboardWidget({
  name: T('Disks w/ZFS Errors'),
  supportedSizes: [SlotSize.Quarter],
  category: WidgetCategory.Storage,
  component: WidgetDisksWithZfsErrorsComponent,
  settingsComponent: WidgetPoolSettingsComponent as Type<WidgetSettingsComponent>,
});
