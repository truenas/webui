import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions,
} from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule } from '@ngx-translate/core';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
import { PreferencesFormComponent } from 'app/modules/layout/topbar/user-menu/preferences-form/preferences-form.component';
import { SplitLinkPipe } from 'app/modules/pipes/split-link/split-link.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
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
    TestDirective,
    SplitLinkPipe,
  ],
})
export class SessionExpiringDialog {
  private dialogRef = inject<MatDialogRef<SessionExpiringDialog>>(MatDialogRef);
  private slideIn = inject(SlideIn);
  private navigateAndHighlight = inject(NavigateAndHighlightService);

  // One sentence for translators; `splitLink` renders the <link> part as the Preferences button.
  protected readonly changeTimeoutHint = T('Change Session Timeout in <link>Preferences</link>');

  options: SessionExpiringDialogOptions;

  constructor() {
    const options = inject<SessionExpiringDialogOptions>(MAT_DIALOG_DATA);

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
