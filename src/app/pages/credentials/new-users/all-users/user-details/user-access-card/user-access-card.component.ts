import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardActions, MatCardContent, MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter, switchMap, tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role, roleNames } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { UsersStore } from 'app/pages/credentials/new-users/store/users.store';
import { UrlOptionsService } from 'app/services/url-options.service';

@UntilDestroy()
@Component({
  selector: 'ix-user-access-card',
  templateUrl: './user-access-card.component.html',
  styleUrls: ['./user-access-card.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatCard,
    IxIconComponent,
    MatCardTitle,
    MatCardHeader,
    MatCardActions,
    MatCardContent,
    TranslateModule,
    NgClass,
    RequiresRolesDirective,
    TestDirective,
  ],
})
export class UserAccessCardComponent {
  user = input.required<User>();

  protected readonly Role = Role;

  readonly sshAccessStatus = computed<string | null>(() => {
    const keySet = this.translate.instant('Key set');
    const passwordLoginEnabled = this.translate.instant('Password login enabled');

    if (this.user().sshpubkey && this.user().ssh_password_enabled) {
      return `${keySet}, ${passwordLoginEnabled}`;
    }
    if (this.user().sshpubkey) {
      return keySet;
    }
    if (this.user().ssh_password_enabled) {
      return passwordLoginEnabled;
    }

    return null;
  });

  readonly rolesAccessStatus = computed<string | null>(() => {
    return this.user().roles
      .map((role) => this.translate.instant(roleNames.get(role) || role))
      .join(', ') || null;
  });

  constructor(
    private router: Router,
    private translate: TranslateService,
    private urlOptions: UrlOptionsService,
    private api: ApiService,
    private loader: LoaderService,
    private dialogService: DialogService,
    private usersStore: UsersStore,
  ) {}

  viewApiKeys(): void {
    this.router.navigate(['/credentials/users/api-keys'], {
      queryParams: { userName: this.user().username },
    });
  }

  viewLogs(): void {
    const url = this.urlOptions.buildUrl('/system/audit', {
      searchQuery: {
        isBasicQuery: false,
        filters: [['username', '=', this.user().username]],
      },
    });
    this.router.navigateByUrl(url);
  }

  lockUnlockUser(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.user().locked
        ? this.translate.instant('Are you sure you want to unlock "{user}" user?', { user: this.user().username })
        : this.translate.instant('Are you sure you want to lock "{user}" user?', { user: this.user().username }),
      hideCheckbox: true,
      buttonText: this.translate.instant(this.user().locked
        ? this.translate.instant('Unlock User')
        : this.translate.instant('Lock User')),
    }).pipe(
      filter(Boolean),
      tap(() => this.loader.open()),
      switchMap(() => this.api.call('user.update', [this.user().id, { locked: !this.user().locked }])),
      untilDestroyed(this),
    ).subscribe({
      next: (updatedUser) => this.usersStore.userUpdated(updatedUser),
      complete: () => this.loader.close(),
    });
  }
}
