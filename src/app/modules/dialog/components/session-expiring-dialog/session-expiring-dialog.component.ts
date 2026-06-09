import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
import { PreferencesFormComponent } from 'app/modules/layout/topbar/user-menu/preferences-form/preferences-form.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';

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
    TnDialogShellComponent,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class SessionExpiringDialog {
  private dialogRef = inject<DialogRef<boolean, SessionExpiringDialog>>(DialogRef);
  private slideIn = inject(SlideIn);
  private navigateAndHighlight = inject(NavigateAndHighlightService);

  options: SessionExpiringDialogOptions;

  constructor() {
    const options = inject<SessionExpiringDialogOptions>(DIALOG_DATA);

    this.options = { ...options };
  }

  extendSession(): void {
    this.dialogRef.close(true);
  }

  openPreferences(): void {
    this.extendSession();
    this.slideIn.open(PreferencesFormComponent);
    // Wait a frame for the slide-in to render before polling for the element.
    setTimeout(() => this.navigateAndHighlight.waitForElement('session-timeout'));
  }
}
