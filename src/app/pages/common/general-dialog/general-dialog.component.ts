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

@Component({
    selector: 'app-general-dialog',
    templateUrl: './general-dialog.component.html',
})
export class GeneralDialogComponent {
    @Input() conf: GeneralDialogConfig;

    constructor(
        public dialogRef: MatDialogRef<GeneralDialogComponent>,
        protected translate: TranslateService) { }

    isDisabled() {
        return false;
    }
}