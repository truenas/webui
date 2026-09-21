import { ChangeDetectionStrategy, Component, ElementRef, viewChild, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions,
} from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ClipboardService } from 'app/services/clipboard.service';
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
  private clipboard = inject(ClipboardService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);

  readonly el = viewChild.required<ElementRef<HTMLInputElement>>('el');

  copyToClipboard(): void {
    const value = this.el().nativeElement.value;
    // Said out loud, like the other four call sites. A refused copy leaves the
    // clipboard holding whatever it held before, and the user is about to go
    // and paste it somewhere — silence here is how they find out too late.
    this.clipboard.copy(value).then(
      () => this.snackbar.success(this.translate.instant('Copied to clipboard')),
      () => this.snackbar.error(this.translate.instant('Failed to copy to clipboard')),
    );
  }
}
