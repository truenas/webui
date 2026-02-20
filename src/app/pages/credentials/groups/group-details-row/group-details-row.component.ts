import { Component, ChangeDetectionStrategy, computed, DestroyRef, input, output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { Group } from 'app/interfaces/group.interface';
import {
  IxTableExpandableRowComponent,
} from 'app/modules/ix-table/components/ix-table-expandable-row/ix-table-expandable-row.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  DeleteGroupDialog,
} from 'app/pages/credentials/groups/group-details-row/delete-group-dialog/delete-group-dialog.component';
import { GroupFormComponent } from 'app/pages/credentials/groups/group-form/group-form.component';

@Component({
  selector: 'ix-group-details-row',
  templateUrl: './group-details-row.component.html',
  styleUrls: ['./group-details-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxTableExpandableRowComponent,
    MatButton,
    TestDirective,
    TnIconComponent,
    RequiresRolesDirective,
    TranslateModule,
    MatTooltip,
  ],
})
export class GroupDetailsRowComponent {
  private slideIn = inject(SlideIn);
  private router = inject(Router);
  private matDialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private translate = inject(TranslateService);

  readonly group = input.required<Group>();
  readonly colspan = input<number>();

  readonly delete = output<number>();
  protected readonly Role = Role;

  protected doEdit(group: Group): void {
    this.slideIn.open(GroupFormComponent, { data: group });
  }

  protected readonly isDeleteDisabled = computed(() => {
    const group = this.group();
    return !group?.local
      || Boolean(group?.roles?.length)
      || Boolean(group?.users?.length);
  });

  protected readonly deleteTooltip = computed(() => {
    const group = this.group();
    if (!group?.local) {
      return this.translate.instant('This group is managed by a directory service and cannot be deleted.');
    }
    if (group?.roles?.length || group?.users?.length) {
      return this.translate.instant('Groups with privileges or members cannot be deleted.');
    }
    return null;
  });

  protected openGroupMembersForm(): void {
    if (this.group().immutable) {
      return;
    }
    this.router.navigate(['/', 'credentials', 'groups', this.group().id, 'members']);
  }

  protected doDelete(group: Group): void {
    if (this.isDeleteDisabled()) return;
    this.matDialog.open(DeleteGroupDialog, { data: group })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((wasDeleted) => {
        if (!wasDeleted) {
          return;
        }

        this.delete.emit(group.id);
      });
  }
}
