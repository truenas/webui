import { Component, Input } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

export interface GeneralDialogConfig {
  title?: string;
  message: string;
  icon?: string;
  is_html?: boolean;
  confirmCheckbox?: boolean;
  confirmCheckboxMsg?: string;
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
 * - use interface GerneralDialogConfig for general config
 */
@Component({
  templateUrl: './general-dialog.component.html',
  styleUrls: ['./general-dialog.component.scss'],
})
export class GeneralDialogComponent {
  @Input() conf: GeneralDialogConfig;

  confirmed = false;
  constructor(
    public dialogRef: MatDialogRef<GeneralDialogComponent>,
  ) { }

  isDisabled(): boolean {
    return this.conf.confirmCheckbox ? !this.confirmed : false;
  }
}
