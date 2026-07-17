import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
import { PreferencesFormComponent } from 'app/modules/layout/topbar/user-menu/preferences-form/preferences-form.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';

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
  private formSidePanel = inject(FormSidePanelService);
  private translate = inject(TranslateService);
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
    this.formSidePanel.open(PreferencesFormComponent, { title: this.translate.instant('Preferences') });
    // Wait a frame for the side panel to render before polling for the element.
    setTimeout(() => this.navigateAndHighlight.waitForElement('session-timeout'));
  }
}
