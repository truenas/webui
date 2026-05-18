import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import {
  dashboardWidget,
} from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import {
  WidgetDatasetCompressionRatioSettingsComponent,
} from 'app/pages/dashboard/widgets/storage/widget-dataset-compression-ratio/widget-dataset-compression-ratio-settings/widget-dataset-compression-ratio-settings.component';
import {
  WidgetDatasetCompressionRatioComponent,
} from 'app/pages/dashboard/widgets/storage/widget-dataset-compression-ratio/widget-dataset-compression-ratio.component';

export interface WidgetDatasetCompressionRatioSettings {
  datasetId: string;
}

export const datasetCompressionRatioWidget = dashboardWidget<WidgetDatasetCompressionRatioSettings>({
  name: T('Dataset Compression Ratio'),
  supportedSizes: [SlotSize.Quarter, SlotSize.Half],
  category: WidgetCategory.Storage,
  component: WidgetDatasetCompressionRatioComponent,
  settingsComponent: WidgetDatasetCompressionRatioSettingsComponent,
});
