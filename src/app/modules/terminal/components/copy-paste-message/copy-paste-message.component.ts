import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import helptext from 'app/helptext/shell/shell';

@Component({
  selector: 'app-copy-paste-message',
  templateUrl: './copy-paste-message.component.html',
})
export class CopyPasteMessageComponent {
  title = helptext.dialog_title;
  messageHtml = helptext.copy_paste_message;

  constructor(public dialogRef: MatDialogRef<CopyPasteMessageComponent>,
    protected translate: TranslateService) {}
}
