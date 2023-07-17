import {
  Component, ChangeDetectionStrategy, Input, EventEmitter, Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { YesNoPipe } from 'app/core/pipes/yes-no.pipe';
import { Option } from 'app/interfaces/option.interface';
import { User } from 'app/interfaces/user.interface';
import {
  DeleteUserDialogComponent,
} from 'app/pages/account/users/user-details-row/delete-user-dialog/delete-user-dialog.component';
import { UserFormComponent } from 'app/pages/account/users/user-form/user-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-user-details-row',
  templateUrl: './user-details-row.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailsRowComponent {
  @Input() user: User;
  @Output() delete = new EventEmitter<number>();

  constructor(
    private translate: TranslateService,
    private slideInService: IxSlideInService,
    private matDialog: MatDialog,
    private yesNoPipe: YesNoPipe,
  ) {}

  getDetails(user: User): Option[] {
    const details = [
      { label: this.translate.instant('GID'), value: user?.group?.bsdgrp_gid },
      { label: this.translate.instant('Home Directory'), value: user.home },
      { label: this.translate.instant('Shell'), value: user.shell },
      { label: this.translate.instant('Email'), value: user.email },
      {
        label: this.translate.instant('Password Disabled'),
        value: this.yesNoPipe.transform(user.password_disabled),
      },
      {
        label: this.translate.instant('Lock User'),
        value: this.yesNoPipe.transform(user.locked),
      },
      {
        label: this.translate.instant('Samba Authentication'),
        value: this.yesNoPipe.transform(user.smb),
      },
    ];

    if (user.sudo_commands?.length > 0) {
      details.push({
        label: this.translate.instant('Allowed Sudo Commands'),
        value: user.sudo_commands.join(', '),
      });
    }

    if (user.sudo_commands_nopasswd?.length > 0) {
      details.push({
        label: this.translate.instant('Allowed Sudo Commands (No Password)'),
        value: user.sudo_commands_nopasswd.join(', '),
      });
    }

    return details;
  }

  doEdit(user: User): void {
    this.slideInService.open(UserFormComponent, { wide: true, data: user });
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

        this.delete.emit(user.id);
      });
  }
}
