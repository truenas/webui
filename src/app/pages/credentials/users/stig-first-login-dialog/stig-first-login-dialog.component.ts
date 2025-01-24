import {
  ChangeDetectionStrategy, Component, signal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatDialogClose } from '@angular/material/dialog';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'app/modules/auth/auth.service';
import { ChangePasswordFormComponent } from 'app/modules/layout/topbar/change-password-dialog/change-password-form/change-password-form.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TwoFactorComponent } from 'app/pages/two-factor-auth/two-factor.component';

@UntilDestroy()
@Component({
  selector: 'ix-stig-first-login-dialog',
  templateUrl: './stig-first-login-dialog.component.html',
  styleUrls: ['./stig-first-login-dialog.component.scss'],
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
export class StigFirstLoginDialogComponent {
  readonly isPasswordUpdated = signal(false);

  constructor(
    private authService: AuthService,
  ) {}

  passwordChanged(): void {
    this.isPasswordUpdated.set(true);

    this.authService.isOptwPasswordChanged$.next(true);
  }
}
