import {
  Component, ChangeDetectionStrategy, input,
  output,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { Option } from 'app/interfaces/option.interface';
import { User } from 'app/interfaces/user.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { IxTableExpandableRowComponent } from 'app/modules/ix-table/components/ix-table-expandable-row/ix-table-expandable-row.component';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  DeleteUserDialogComponent,
} from 'app/pages/credentials/users/user-details-row/delete-user-dialog/delete-user-dialog.component';
import { UserFormComponent } from 'app/pages/credentials/users/user-form/user-form.component';
import { SlideInService } from 'app/services/slide-in.service';
import { UrlOptionsService } from 'app/services/url-options.service';

@UntilDestroy()
@Component({
  selector: 'ix-user-details-row',
  templateUrl: './user-details-row.component.html',
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
export class UserDetailsRowComponent {
  readonly user = input.required<User>();
  readonly delete = output<number>();

  protected readonly Role = Role;

  constructor(
    private translate: TranslateService,
    private slideInService: SlideInService,
    private matDialog: MatDialog,
    private yesNoPipe: YesNoPipe,
    private urlOptions: UrlOptionsService,
    private router: Router,
  ) {}

  getDetails(user: User): Option[] {
    const details = [
      {
        label: this.translate.instant('API Keys'),
        value: this.translate.instant('{n, plural, =0 {No keys} =1 {# key} other {# keys}}', {
          n: user?.api_keys?.length,
        }),
      },
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
      {
        label: 'SSH',
        value: this.getSshStatus(user),
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

  viewLogs(user: User): void {
    const url = this.urlOptions.buildUrl('/system/audit', {
      searchQuery: {
        isBasicQuery: false,
        filters: [['username', '=', user.username]],
      },
    });
    this.router.navigateByUrl(url);
  }

  private getSshStatus(user: User): string {
    const keySet = this.translate.instant('Key set');
    const passwordLoginEnabled = this.translate.instant('Password login enabled');

    if (user.sshpubkey && user.ssh_password_enabled) {
      return `${keySet}, ${passwordLoginEnabled}`;
    }
    if (user.sshpubkey) {
      return keySet;
    }
    if (user.ssh_password_enabled) {
      return passwordLoginEnabled;
    }

    return this.translate.instant('Key not set');
  }
}
