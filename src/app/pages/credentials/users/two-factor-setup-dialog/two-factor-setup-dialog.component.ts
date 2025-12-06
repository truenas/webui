import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { AuthService } from 'app/modules/auth/auth.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TwoFactorComponent } from 'app/pages/two-factor-auth/two-factor.component';

@UntilDestroy()
@Component({
  selector: 'ix-two-factor-setup-dialog',
  templateUrl: './two-factor-setup-dialog.component.html',
  styleUrls: ['./two-factor-setup-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    TwoFactorComponent,
    MatButton,
    TestDirective,
    MatDialogClose,
  ],
})
export class TwoFactorSetupDialog {
  private authService = inject(AuthService);
  private dialogRef = inject(MatDialogRef<TwoFactorSetupDialog>);

  protected canFinish = toSignal(
    this.authService.userTwoFactorConfig$.pipe(map((config) => config.secret_configured)),
  );

  protected onSkipSetup(): void {
    this.dialogRef.close(true);
  }
}
