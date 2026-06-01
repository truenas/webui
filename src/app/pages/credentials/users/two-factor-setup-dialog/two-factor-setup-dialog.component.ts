import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { TnDialogShellComponent } from '@truenas/ui-components';
import { map } from 'rxjs';
import { AuthService } from 'app/modules/auth/auth.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
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
    MatButton,
    TestDirective,
  ],
})
export class TwoFactorSetupDialog {
  private authService = inject(AuthService);
  protected dialogRef = inject(DialogRef<unknown, TwoFactorSetupDialog>);

  protected canFinish = toSignal(
    this.authService.userTwoFactorConfig$.pipe(map((config) => config.secret_configured)),
  );

  protected onSkipSetup(): void {
    this.dialogRef.close(true);
  }
}
