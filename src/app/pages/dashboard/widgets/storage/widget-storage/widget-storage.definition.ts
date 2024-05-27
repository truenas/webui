import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetStorageComponent } from 'app/pages/dashboard/widgets/storage/widget-storage/widget-storage.component';

export const storageWidget = dashboardWidget({
  name: T('Storage'),
  supportedSizes: [SlotSize.Full],
  category: WidgetCategory.Storage,
  component: WidgetStorageComponent,
  settingsComponent: null,
});
