import {
  ChangeDetectionStrategy, Component, computed, input,
  output,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardActions, MatCardContent, MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role, roleNames } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { UserLastActionComponent } from 'app/pages/credentials/new-users/all-users/user-details/user-last-action/user-last-action.component';
import {
  ApiKeyFormComponent,
} from 'app/pages/credentials/users/user-api-keys/components/api-key-form/api-key-form.component';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
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
    RequiresRolesDirective,
    TestDirective,
    UserLastActionComponent,
    RouterLink,
  ],
})
export class UserAccessCardComponent {
  user = input.required<User>();
  reloadUsers = output();

  protected readonly Role = Role;
  protected readonly unlockUserText = this.translate.instant('Unlock User');
  protected readonly lockUserText = this.translate.instant('Lock User');

  readonly sshAccessStatus = computed<string | null>(() => {
    if (this.user().sshpubkey && this.user().ssh_password_enabled) {
      return this.translate.instant('SSH Key Set & Password Login Enabled');
    }
    if (this.user().sshpubkey) {
      return this.translate.instant('SSH Key Set');
    }
    if (this.user().ssh_password_enabled) {
      return this.translate.instant('SSH Password Login Enabled');
    }

    return null;
  });

  readonly noShellAccess = computed(() => {
    return this.user().shell === '/usr/bin/nologin' || this.user().shell === '/usr/sbin/nologin';
  });

  readonly rolesAccessStatus = computed<string | null>(() => {
    return this.user().roles
      .map((role) => this.translate.instant(roleNames.get(role) || role))
      .join(', ') || null;
  });

  protected canAddApiKeys = computed(() => {
    // TODO: Matches condition in api-key-form, but may not be correct.
    return this.user().roles.length && this.user().local;
  });

  constructor(
    private translate: TranslateService,
    private api: ApiService,
    private loader: LoaderService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private snackbar: SnackbarService,
    private slideIn: SlideIn,
    private downloadService: DownloadService,
    private urlOptions: UrlOptionsService,
  ) {}

  protected get auditLink(): string {
    return this.urlOptions.buildUrl('/system/audit', {
      searchQuery: {
        isBasicQuery: false,
        filters: [['username', '=', this.user().username]],
      },
    });
  }

  protected toggleLockStatus(): void {
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
      switchMap(() => {
        return this.api.call('user.update', [id, { locked: !locked }]).pipe(
          this.loader.withLoader(),
          this.errorHandler.withErrorHandler(),
        );
      }),
      untilDestroyed(this),
    ).subscribe(() => {
      this.snackbar.success(
        locked
          ? this.translate.instant('User unlocked')
          : this.translate.instant('User locked'),
      );
    });
  }

  protected onDownloadSshPublicKey(): void {
    const name = this.user().username;
    const key = this.user().sshpubkey;
    const blob = new Blob([key], { type: 'text/plain' });
    this.downloadService.downloadBlob(blob, `${name}_public_key_rsa`);
  }

  protected onAddApiKey(): void {
    this.slideIn
      .open(ApiKeyFormComponent, { data: { username: this.user().username } })
      .pipe(untilDestroyed(this)).subscribe(() => {
        // TODO: Reload single record once routing is in.
        this.reloadUsers.emit();
      });
  }
}
