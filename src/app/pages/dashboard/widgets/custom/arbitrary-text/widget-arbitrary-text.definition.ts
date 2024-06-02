import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import {
  dashboardWidget,
} from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetArbitraryTextSettingsComponent } from 'app/pages/dashboard/widgets/custom/arbitrary-text/widget-arbitrary-text-settings/widget-arbitrary-text-settings.component';
import { WidgetArbitraryTextComponent } from 'app/pages/dashboard/widgets/custom/arbitrary-text/widget-arbitrary-text.component';

export interface WidgetArbitraryTextSettings {
  widgetTitle: string;
  widgetText: string;
  widgetSubText?: string;
}

export const arbitraryTextWidget = dashboardWidget<WidgetArbitraryTextSettings>({
  name: T('Arbitrary Text'),
  supportedSizes: [SlotSize.Quarter, SlotSize.Half, SlotSize.Full],
  category: WidgetCategory.Custom,
  component: WidgetArbitraryTextComponent,
  settingsComponent: WidgetArbitraryTextSettingsComponent,
});
