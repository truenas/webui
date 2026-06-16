import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, TemplateRef, input, output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent, TnTestIdDirective } from '@truenas/ui-components';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { BackupTaskActionsComponent } from 'app/pages/dashboard/widgets/backup/widget-backup/backup-task-actions/backup-task-actions.component';

@Component({
  selector: 'ix-backup-task-empty',
  templateUrl: './backup-task-empty.component.html',
  styleUrl: './backup-task-empty.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconComponent,
    RequiresRolesDirective,
    TnTestIdDirective,
    NgxSkeletonLoaderModule,
    TranslateModule,
    NgTemplateOutlet,
  ],
})
export class BackupTaskEmptyComponent {
  backupActions = input<TemplateRef<BackupTaskActionsComponent>>();
  isLoading = input<boolean>();

  readonly taskAdded = output();
  readonly addReplicationTask = output();
  readonly addRsyncTask = output();
  readonly addCloudSyncTask = output();

  readonly Role = Role;
}
