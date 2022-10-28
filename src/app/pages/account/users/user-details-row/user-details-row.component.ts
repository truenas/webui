import {
  Component, ChangeDetectionStrategy, Input, EventEmitter, Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Option } from 'app/interfaces/option.interface';
import { User } from 'app/interfaces/user.interface';
import {
  DeleteUserDialogComponent,
} from 'app/pages/account/users/user-details-row/delete-user-dialog/delete-user-dialog.component';
import { UserFormComponent } from 'app/pages/account/users/user-form/user-form.component';
import {
  WebSocketService, DialogService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-user-details-row',
  templateUrl: './user-details-row.component.html',
  styleUrls: ['./user-details-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailsRowComponent {
  @Input() user: User;
  @Input() colspan: number;
  @Output() update = new EventEmitter<void>();

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private slideIn: IxSlideInService,
    private matDialog: MatDialog,
  ) {}

  getDetails(user: User): Option[] {
    return [
      { label: this.translate.instant('GID'), value: user?.group?.bsdgrp_gid },
      { label: this.translate.instant('Home Directory'), value: user.home },
      { label: this.translate.instant('Shell'), value: user.shell },
      { label: this.translate.instant('Email'), value: user.email },
      { label: this.translate.instant('Password Disabled'), value: user.password_disabled.toString() },
      { label: this.translate.instant('Lock User'), value: user.locked.toString() },
      { label: this.translate.instant('Permit Sudo'), value: user.sudo.toString() },
      { label: this.translate.instant('Samba Authentication'), value: user.smb.toString() },
    ];
  }

  doEdit(user: User): void {
    const editForm = this.slideIn.open(UserFormComponent, { wide: true });
    if (editForm) {
      editForm.setupForm(user);
    }
  }

  doDelete(user: User): void {
    this.matDialog.open(DeleteUserDialogComponent, {
      data: user,
    })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((wasDeleted) => {
        if (!wasDeleted) {
          return;
        }

        this.update.emit();
      });
  }
}
