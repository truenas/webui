import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, input,
  output,
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
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ApiKeyFormComponent } from 'app/pages/credentials/users/user-api-keys/components/api-key-form/api-key-form.component';
import { UrlOptionsService } from 'app/services/url-options.service';

@UntilDestroy()
@Component({
  selector: 'ix-user-access-card',
  templateUrl: './user-access-card.component.html',
  styleUrls: ['./user-access-card.component.scss'],
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
  reloadUsers = output();

  protected readonly Role = Role;
  protected readonly unlockUserText = this.translate.instant('Unlock User');
  protected readonly lockUserText = this.translate.instant('Lock User');

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
    private slideIn: SlideIn,
  ) {}

  handleApiKeys(hasApiKeys: boolean): void {
    if (hasApiKeys) {
      this.router.navigate(['/credentials/users/api-keys'], {
        queryParams: { userName: this.user().username },
      });
    } else {
      this.slideIn.open(ApiKeyFormComponent).pipe(
        filter((response) => !!response.response),
        untilDestroyed(this),
      ).subscribe(() => this.reloadUsers.emit());
    }
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

  toggleLockStatus(): void {
    const { locked, username, id } = this.user();
    const message = locked
      ? this.translate.instant('Are you sure you want to unlock "{user}" user?', { user: username })
      : this.translate.instant('Are you sure you want to lock "{user}" user?', { user: username });
    const buttonText = locked ? this.unlockUserText : this.lockUserText;

    this.dialogService.confirm({
      message,
      buttonText,
      title: this.translate.instant('Confirmation'),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      tap(() => this.loader.open()),
      switchMap(() => this.api.call('user.update', [id, { locked: !locked }])),
      untilDestroyed(this),
    ).subscribe({
      complete: () => this.loader.close(),
    });
  }
}
