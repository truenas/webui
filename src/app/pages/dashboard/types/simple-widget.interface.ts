import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { WidgetType } from 'app/pages/dashboard/types/widget.interface';

export interface SimpleWidget {
  category: WidgetCategory;
  type: WidgetType;
  [key: string]: unknown;
}
