import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { MarkdownModule } from 'ngx-markdown';

export interface AppNotesDialogData {
  name: string;
  notes: string;
}

@Component({
  selector: 'ix-app-notes-dialog',
  templateUrl: './app-notes-dialog.component.html',
  styleUrls: ['./app-notes-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TnButtonComponent,
    TranslateModule,
    MarkdownModule,
  ],
})
export class AppNotesDialog {
  private ref = inject<DialogRef<void>>(DialogRef);
  protected data = inject<AppNotesDialogData>(DIALOG_DATA);

  protected close(): void {
    this.ref.close();
  }
}
