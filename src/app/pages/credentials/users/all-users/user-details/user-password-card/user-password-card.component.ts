import { Component, ChangeDetectionStrategy, computed, DestroyRef, input, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardTitle, MatCardHeader, MatCardContent,
  MatCardActions,
} from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { filter, of, switchMap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextUsers } from 'app/helptext/account/user-form';
import { User } from 'app/interfaces/user.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { userPasswordCardElements } from 'app/pages/credentials/users/all-users/user-details/user-password-card/user-password-card.elements';
import { OneTimePasswordCreatedDialog } from 'app/pages/credentials/users/one-time-password-created-dialog/one-time-password-created-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-user-password-card',
  templateUrl: './user-password-card.component.html',
  styleUrls: ['./user-password-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardTitle,
    MatCardHeader,
    MatCardContent,
    TranslateModule,
    FormatDateTimePipe,
    MatCardActions,
    MatTooltip,
    RequiresRolesDirective,
    TestDirective,
    TnIconComponent,
    MatButton,
    UiSearchDirective,
  ],
})
export class UserPasswordCardComponent {
  private authService = inject(AuthService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private loader = inject(LoaderService);
  private api = inject(ApiService);
  private matDialog = inject(MatDialog);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  user = input.required<User>();

  protected readonly Role = Role;

  loggedInUser = toSignal(this.authService.user$.pipe(filter(Boolean)));

  protected readonly searchableElements = userPasswordCardElements;

  protected readonly isOtpDisabled = computed(() => !this.user().roles?.length);

  protected readonly otpDisabledTooltip = computed(() => {
    if (!this.isOtpDisabled()) return '';
    return this.translate.instant('Generating a one-time password requires the user to have TrueNAS access roles.');
  });

  protected generateOneTimePassword(): void {
    const { username } = this.user();

    this.dialogService.confirm({
      title: this.translate.instant('Generate One-Time Password'),
      message: this.translate.instant(helptextUsers.oneTimePasswordWarning),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        return this.api.call('auth.generate_onetime_password', [{ username }]).pipe(
          switchMap((password) => {
            this.matDialog.open(OneTimePasswordCreatedDialog, { data: password });
            return of(password);
          }),
          this.loader.withLoader(),
        );
      }),
      this.errorHandler.withErrorHandler(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }
}
