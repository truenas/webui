import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { helptextShell } from 'app/helptext/shell/shell';

@Component({
  templateUrl: './copy-paste-message.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyPasteMessageComponent {
  title = helptextShell.dialog_title;
  messageHtml = helptextShell.copy_paste_message;

  constructor(
    public dialogRef: MatDialogRef<CopyPasteMessageComponent>,
    protected translate: TranslateService,
  ) {}
}
