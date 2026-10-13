import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule } from '@ngx-translate/core';
import { TnTestIdDirective } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { SplitTagPipe } from 'app/modules/pipes/split-tag/split-tag.pipe';

@Component({
  selector: 'ix-backup-task-actions',
  templateUrl: './backup-task-actions.component.html',
  styleUrl: './backup-task-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RequiresRolesDirective,
    TnTestIdDirective,
    TranslateModule,
    SplitTagPipe,
  ],
})
export class BackupTaskActionsComponent {
  allCount = input<number>();

  readonly taskAdded = output();
  readonly addReplicationTask = output();
  readonly addCloudSyncTask = output();

  readonly Role = Role;
  // One sentence for translators; `splitTag` renders each tagged part as its own link.
  // Keep <cloud> before <truenas>: the template splits them in that order.
  protected readonly backupSentence = T('Backup <cloud>to cloud</cloud> or <truenas>to another TrueNAS</truenas>');
}
