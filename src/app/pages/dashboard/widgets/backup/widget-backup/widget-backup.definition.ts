import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import {
  dashboardWidget,
} from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetBackupComponent } from 'app/pages/dashboard/widgets/backup/widget-backup/widget-backup.component';

export const backupTasksWidget = dashboardWidget({
  name: T('Backup Tasks'),
  supportedSizes: [SlotSize.Full],
  category: WidgetCategory.BackupTasks,
  component: WidgetBackupComponent,
  settingsComponent: null,
});
