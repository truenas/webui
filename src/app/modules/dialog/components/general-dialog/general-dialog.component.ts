import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent, TnIconComponent } from '@truenas/ui-components';

export interface GeneralDialogConfig {
  title?: string;
  message: string;
  icon?: string;
  is_html?: boolean;
  hideCancel?: boolean;
  cancelBtnMsg?: string;
  confirmBtnMsg?: string;
}
/**
 * General Dialog Component
 *
 * - able to be used as simple dialog to display text content, alert dialog with icon,
 * confirm dialog with single checkbox, able to display text as html or not
 * - use interface GeneralDialogConfig for general config
 */
@Component({
  selector: 'ix-general-dialog',
  templateUrl: './general-dialog.component.html',
  styleUrls: ['./general-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TnButtonComponent,
    TnIconComponent,
    TranslateModule,
  ],
})
export class GeneralDialog {
  protected dialogRef = inject<DialogRef<boolean, GeneralDialog>>(DialogRef);
  conf = inject<GeneralDialogConfig>(DIALOG_DATA);
}
