import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

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
 * - works with MatDialogConf
 * - use interface GeneralDialogConfig for general config
 */
@Component({
  templateUrl: './general-dialog.component.html',
  styleUrls: ['./general-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralDialogComponent {
  @Input() conf: GeneralDialogConfig;

  constructor(
    public dialogRef: MatDialogRef<GeneralDialogComponent>,
  ) { }
}
