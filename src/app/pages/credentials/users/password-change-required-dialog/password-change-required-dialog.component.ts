import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { MatToolbarRow } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'app/modules/auth/auth.service';
import { ChangePasswordFormComponent } from 'app/modules/layout/topbar/change-password-dialog/change-password-form/change-password-form.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-password-change-required-dialog',
  templateUrl: './password-change-required-dialog.component.html',
  styleUrls: ['./password-change-required-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    ChangePasswordFormComponent,
    MatButton,
    MatCard,
    MatToolbarRow,
    TestDirective,
    MatDialogClose,
  ],
})
export class PasswordChangeRequiredDialog {
  protected isPasswordChangeRequired = toSignal(
    this.authService.isPasswordChangeRequired$,
  );

  constructor(
    protected authService: AuthService,
    private dialogRef: MatDialogRef<PasswordChangeRequiredDialog>,
    private router: Router,
    private wsHandler: WebSocketHandlerService,
  ) { }

  protected onPasswordUpdated(): void {
    this.authService.requiredPasswordChanged();
  }

  logOut(): void {
    this.authService.logout()
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.wsHandler.reconnect();
        this.router.navigate(['/signin']);
        this.dialogRef.close();
      });
  }
}
