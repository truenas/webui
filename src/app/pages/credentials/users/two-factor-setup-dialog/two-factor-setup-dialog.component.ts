import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { TwoFactorComponent } from 'app/pages/two-factor-auth/two-factor.component';

@Component({
  selector: 'ix-two-factor-setup-dialog',
  templateUrl: './two-factor-setup-dialog.component.html',
  styleUrls: ['./two-factor-setup-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TranslateModule,
    TwoFactorComponent,
    TnButtonComponent,
  ],
})
export class TwoFactorSetupDialog {
  protected dialogRef = inject(DialogRef<unknown, TwoFactorSetupDialog>);

  /**
   * Driven by the setup component rather than by `secret_configured` alone: a secret
   * exists from the moment it is generated, but offering Finish then would let the user
   * leave with 2FA armed against a secret their authenticator app may never have taken.
   */
  protected canFinish = signal(false);

  protected onSkipSetup(): void {
    this.dialogRef.close(true);
  }
}
