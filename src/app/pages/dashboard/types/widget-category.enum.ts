import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum WidgetCategory {
  Network = 'network',
}

export const widgetCategoryLabels = new Map<WidgetCategory, string>([
  [WidgetCategory.Network, T('Network')],
]);
