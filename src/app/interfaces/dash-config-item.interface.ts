import { WidgetName } from 'app/enums/widget-name.enum';

export interface DashConfigItem {
  name: WidgetName;
  identifier?: string; // Comma separated 'key,value' eg. pool might have 'name,tank'
  rendered: boolean;
  position?: number;
  id?: string;
}
