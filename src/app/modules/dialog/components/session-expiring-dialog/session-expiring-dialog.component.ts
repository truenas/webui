import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { NavigateAndHighlightDirective } from 'app/directives/navigate-and-interact/navigate-and-highlight.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';

export interface SessionExpiringDialogOptions {
  title: string;
  message: string;
  buttonText: string;
}

@Component({
  selector: 'ix-session-expiring-dialog',
  templateUrl: './session-expiring-dialog.component.html',
  styleUrls: ['./session-expiring-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    TranslateModule,
    NavigateAndHighlightDirective,
    TestDirective,
  ],
})
export class SessionExpiringDialog {
  private dialogRef = inject<MatDialogRef<SessionExpiringDialog>>(MatDialogRef);

  options: SessionExpiringDialogOptions;

  constructor() {
    const options = inject<SessionExpiringDialogOptions>(MAT_DIALOG_DATA);

    this.options = { ...options };
  }

  extendSession(): void {
    this.dialogRef.close(true);
  }

  viewSessionsCard(): void {
    this.extendSession();
  }
}
