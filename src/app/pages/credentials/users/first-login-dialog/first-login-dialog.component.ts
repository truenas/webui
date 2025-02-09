import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatDialogClose } from '@angular/material/dialog';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { AuthService } from 'app/modules/auth/auth.service';
import { ChangePasswordFormComponent } from 'app/modules/layout/topbar/change-password-dialog/change-password-form/change-password-form.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TwoFactorComponent } from 'app/pages/two-factor-auth/two-factor.component';

@UntilDestroy()
@Component({
  selector: 'ix-first-login-dialog',
  templateUrl: './first-login-dialog.component.html',
  styleUrls: ['./first-login-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslateModule,
    ChangePasswordFormComponent,
    TwoFactorComponent,
    MatButton,
    MatCard,
    MatToolbarRow,
    TestDirective,
    MatDialogClose,
  ],
})
export class FirstLoginDialogComponent {
  isOtpwUser = toSignal(this.authService.isOtpwUser$);
  wasOneTimePasswordChanged = toSignal(this.authService.wasOneTimePasswordChanged$);
  userTwoFactorAuthConfigured = toSignal(this.authService.userTwoFactorConfig$.pipe(
    map((config) => config.secret_configured),
  ));

  constructor(private authService: AuthService) {}

  passwordChanged(): void {
    this.authService.wasOneTimePasswordChanged$.next(true);
  }
}
