import {
  Component, ChangeDetectionStrategy, input, output,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { Group } from 'app/interfaces/group.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import {
  IxTableExpandableRowComponent,
} from 'app/modules/ix-table/components/ix-table-expandable-row/ix-table-expandable-row.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  DeleteGroupDialogComponent,
} from 'app/pages/credentials/groups/group-details-row/delete-group-dialog/delete-group-dialog.component';
import { GroupFormComponent } from 'app/pages/credentials/groups/group-form/group-form.component';
import { SlideInService } from 'app/services/slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-group-details-row',
  templateUrl: './group-details-row.component.html',
  styleUrls: ['./group-details-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxTableExpandableRowComponent,
    MatButton,
    TestDirective,
    IxIconComponent,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class GroupDetailsRowComponent {
  readonly group = input.required<Group>();
  readonly colspan = input<number>();

  readonly delete = output<number>();

  protected readonly Role = Role;

  constructor(
    private slideInService: SlideInService,
    private router: Router,
    private matDialog: MatDialog,
  ) {}

  doEdit(group: Group): void {
    this.slideInService.open(GroupFormComponent, { data: group });
  }

  openGroupMembersForm(): void {
    this.router.navigate(['/', 'credentials', 'groups', this.group().id, 'members']);
  }

  doDelete(group: Group): void {
    this.matDialog.open(DeleteGroupDialogComponent, { data: group })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((wasDeleted) => {
        if (!wasDeleted) {
          return;
        }

        this.delete.emit(group.id);
      });
  }
}
