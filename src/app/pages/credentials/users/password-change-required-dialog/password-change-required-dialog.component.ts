import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatCard } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { AuthService } from 'app/modules/auth/auth.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { ChangePasswordFormComponent } from 'app/modules/layout/topbar/change-password-dialog/change-password-form/change-password-form.component';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';

@Component({
  selector: 'ix-password-change-required-dialog',
  templateUrl: './password-change-required-dialog.component.html',
  styleUrls: ['./password-change-required-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TranslateModule,
    ChangePasswordFormComponent,
    TnButtonComponent,
    FormActionsComponent,
    MatCard,
    MatToolbarRow,
  ],
})
export class PasswordChangeRequiredDialog {
  protected authService = inject(AuthService);
  protected dialogRef = inject<DialogRef<unknown, PasswordChangeRequiredDialog>>(DialogRef);
  private router = inject(Router);
  private wsHandler = inject(WebSocketHandlerService);
  private destroyRef = inject(DestroyRef);

  protected isPasswordChangeRequired = toSignal(
    this.authService.isPasswordChangeRequired$,
  );

  protected onPasswordUpdated(): void {
    this.authService.requiredPasswordChanged();
  }

  protected logOut(): void {
    this.authService.logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.wsHandler.reconnect();
        this.router.navigate(['/signin']);
        this.dialogRef.close();
      });
  }
}
