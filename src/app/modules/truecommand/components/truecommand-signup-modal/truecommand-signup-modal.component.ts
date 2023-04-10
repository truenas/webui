import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { WINDOW } from 'app/helpers/window.helper';
import helptext from 'app/helptext/topbar';

@Component({
  templateUrl: './truecommand-signup-modal.component.html',
  styleUrls: ['./truecommand-signup-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruecommandSignupModalComponent {
  readonly helptext = helptext;
  constructor(
    private dialogRef: MatDialogRef<TruecommandSignupModalComponent>,
    @Inject(WINDOW) private window: Window,
  ) { }

  onSignup(): void {
    this.window.open('https://portal.ixsystems.com');
    this.dialogRef.close(false);
  }
}
