import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, ElementRef, viewChild, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent, TnTestIdDirective } from '@truenas/ui-components';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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
    TnDialogShellComponent,
    TnButtonComponent,
    TranslateModule,
    TnTestIdDirective,
  ],
})
export class RedirectDialog {
  dialogRef = inject<DialogRef<boolean, RedirectDialog>>(DialogRef);
  data = inject<RedirectDialogData>(DIALOG_DATA);
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
