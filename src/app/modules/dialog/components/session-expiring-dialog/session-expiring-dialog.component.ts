import {
  ChangeDetectionStrategy,
  Component, Inject,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { NavigateAndInteractDirective } from 'app/directives/navigate-and-interact/navigate-and-interact.directive';
import { ConfirmOptionsWithSecondaryCheckbox } from 'app/interfaces/dialog.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-session-expiring-dialog',
  templateUrl: './session-expiring-dialog.component.html',
  styleUrls: ['./session-expiring-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    TranslateModule,
    NavigateAndInteractDirective,
    TestDirective,
  ],
})
export class SessionExpiringDialogComponent {
  options: ConfirmOptionsWithSecondaryCheckbox;

  constructor(
    private dialogRef: MatDialogRef<SessionExpiringDialogComponent>,
    @Inject(MAT_DIALOG_DATA) options: ConfirmOptionsWithSecondaryCheckbox,
  ) {
    this.options = { ...options };
  }

  extendSession(): void {
    this.dialogRef.close(true);
  }

  viewSessionsCard(): void {
    this.extendSession();
  }
}
