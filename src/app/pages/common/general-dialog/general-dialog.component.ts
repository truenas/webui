import { Component, Input } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog'
import { TranslateService } from '@ngx-translate/core';

export interface GeneralDialogConfig {
    title?: string,
    message: string,
    icon?: string,
    is_html?: boolean,
    confirmCheckbox?: boolean,
    confirmCheckboxMsg?: string,
    hideCancel?: boolean,
    cancelBtnMsg?: string,
    confirmBtnMsg?: string,
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
    selector: 'app-general-dialog',
    templateUrl: './general-dialog.component.html',
    styleUrls: ['./general-dialog.component.css']
})
export class GeneralDialogComponent {
    @Input() conf: GeneralDialogConfig;

    public confirmed = false;
    constructor(
        public dialogRef: MatDialogRef<GeneralDialogComponent>,
        protected translate: TranslateService) { }

    isDisabled() {
        return this.conf.confirmCheckbox ? !this.confirmed :false;
    }
}