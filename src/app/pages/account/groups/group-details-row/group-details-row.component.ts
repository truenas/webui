import {
  Component, ChangeDetectionStrategy, Input, EventEmitter, Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Group } from 'app/interfaces/group.interface';
import {
  DeleteGroupDialogComponent,
} from 'app/pages/account/groups/group-details-row/delete-group-dialog/delete-group-dialog.component';
import { GroupFormComponent } from 'app/pages/account/groups/group-form/group-form.component';
import { IxSlideIn2Service } from 'app/services/ix-slide-in2.service';

@UntilDestroy()
@Component({
  selector: 'ix-group-details-row',
  templateUrl: './group-details-row.component.html',
  styleUrls: ['./group-details-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupDetailsRowComponent {
  @Input() group: Group;
  @Input() colspan: number;
  @Output() delete = new EventEmitter<number>();

  constructor(
    private slideIn: IxSlideIn2Service,
    private router: Router,
    private matDialog: MatDialog,
  ) {}

  doEdit(group: Group): void {
    this.slideIn.open(GroupFormComponent, { data: group });
  }

  openGroupMembersForm(): void {
    this.router.navigate(['/', 'credentials', 'groups', this.group.id, 'members']);
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
