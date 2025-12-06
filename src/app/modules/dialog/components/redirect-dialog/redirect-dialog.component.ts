import { ChangeDetectionStrategy, Component, ElementRef, viewChild, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  RedirectDialogData,
} from './redirect-dialog-data.interface';

@Component({
  selector: 'ix-redirect-dialog',
  templateUrl: './redirect-dialog.component.html',
  styleUrls: ['./redirect-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    TranslateModule,
    TestDirective,
  ],
})
export class RedirectDialog {
  dialogRef = inject<MatDialogRef<RedirectDialog>>(MatDialogRef);
  data = inject<RedirectDialogData>(MAT_DIALOG_DATA);

  readonly el = viewChild.required<ElementRef<HTMLInputElement>>('el');

  copyToClipboard(): void {
    const value = this.el().nativeElement.value;
    navigator.clipboard.writeText(value);
  }
}
