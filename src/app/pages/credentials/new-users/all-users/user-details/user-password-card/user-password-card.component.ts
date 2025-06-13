import {
  Component, ChangeDetectionStrategy, input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardTitle, MatCardHeader, MatCardContent,
  MatCardActions,
} from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter, of, switchMap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { OneTimePasswordCreatedDialog } from 'app/pages/credentials/users/one-time-password-created-dialog/one-time-password-created-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
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
    RequiresRolesDirective,
    TestDirective,
    IxIconComponent,
    MatButton,
    MatTooltip,
  ],
})
export class UserPasswordCardComponent {
  user = input.required<User>();

  protected readonly Role = Role;

  loggedInUser = toSignal(this.authService.user$.pipe(filter(Boolean)));

  constructor(
    private authService: AuthService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private loader: LoaderService,
    private api: ApiService,
    private matDialog: MatDialog,
    private errorHandler: ErrorHandlerService,
  ) {}

  generateOneTimePassword(): void {
    const { username } = this.user();

    this.dialogService.confirm({
      title: this.translate.instant('Generate One-Time Password'),
      message: this.translate.instant(
        'Are you sure you want to generate a one-time password for "{username}" user?',
        { username },
      ),
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
      untilDestroyed(this),
    ).subscribe();
  }
}
