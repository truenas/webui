import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, ElementRef, viewChild, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent, TnTestIdDirective } from '@truenas/ui-components';
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

  readonly el = viewChild.required<ElementRef<HTMLInputElement>>('el');

  copyToClipboard(): void {
    const value = this.el().nativeElement.value;
    // Nothing to report a failure to here, but the copy must not throw at the
    // caller either — over HTTP the old call did exactly that.
    this.clipboard.copy(value).catch((): void => undefined);
  }
}
