import { WidgetName } from 'app/pages/dashboard/services/dashboard.store';

/**
 * Old dashboard configuration item interface.
 * This is stored in user attributes but no longer actively used by the new dashboard.
 * Kept for compatibility with older user data.
 */
export interface DashConfigItem {
  name: WidgetName;
  identifier?: string; // Comma separated 'key,value' eg. pool might have 'name,tank'
  rendered: boolean;
  position?: number;
  id?: string;
}
