import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions,
} from '@angular/material/dialog';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { helptextShell } from 'app/helptext/shell/shell';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-copy-paste-message',
  templateUrl: './copy-paste-message.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class CopyPasteMessageComponent {
  title = helptextShell.dialog_title;
  messageHtml = helptextShell.copy_paste_message;

  constructor(
    public dialogRef: MatDialogRef<CopyPasteMessageComponent>,
    protected translate: TranslateService,
  ) {}
}
