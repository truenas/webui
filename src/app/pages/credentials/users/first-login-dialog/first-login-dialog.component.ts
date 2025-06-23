import {
  ChangeDetectionStrategy, Component,
  computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatDialogClose } from '@angular/material/dialog';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { map, take } from 'rxjs';
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
  protected isOtpwUser = toSignal(this.authService.isOtpwUser$);
  protected isLocalUser = toSignal(this.authService.isLocalUser$);
  protected wasOneTimePasswordChanged = toSignal(this.authService.wasOneTimePasswordChanged$);
  private userTwoFactorConfigured$ = this.authService.userTwoFactorConfig$.pipe(
    map((config) => config.secret_configured),
  );

  protected initialUserTwoFactorAuthConfigured = toSignal(
    this.userTwoFactorConfigured$.pipe(take(1), map(() => false)),
  );

  protected userTwoFactorAuthConfigured = toSignal(
    this.userTwoFactorConfigured$,
  );

  protected isGlobalTwoFactorEnabled = toSignal(
    this.authService.getGlobalTwoFactorConfig().pipe(
      map((config) => config.enabled),
    ),
  );

  protected canFinish = computed(() => {
    const isOtpwUser = this.isOtpwUser();
    const isLocalUser = this.isLocalUser();
    const wasOneTimePasswordChanged = this.wasOneTimePasswordChanged();
    const userTwoFactorAuthConfigured = this.userTwoFactorAuthConfigured();
    const isGlobalTwoFactorEnabled = this.isGlobalTwoFactorEnabled();
    const isOtpwUserCompleted = isOtpwUser && isLocalUser && wasOneTimePasswordChanged;
    const isOtpwChangeNotApplicable = !isLocalUser;
    const canOtpwProceed = isOtpwChangeNotApplicable || isOtpwUserCompleted || !isOtpwUser;

    const is2faCompleted = isGlobalTwoFactorEnabled && userTwoFactorAuthConfigured;
    const is2faNotApplicable = !isGlobalTwoFactorEnabled;
    const can2faProceed = is2faCompleted || is2faNotApplicable;
    return can2faProceed && canOtpwProceed;
  });

  constructor(private authService: AuthService) {}

  protected passwordChanged(): void {
    this.authService.wasOneTimePasswordChanged$.next(true);
  }
}
