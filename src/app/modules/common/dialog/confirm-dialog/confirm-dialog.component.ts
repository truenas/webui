import { Component, Output, EventEmitter } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ApiMethod } from 'app/interfaces/api-directory.interface';

@Component({
  selector: 'ix-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent {
  title: string;
  message: string;
  buttonMsg: string = this.translate.instant('Continue');
  cancelMsg: string = this.translate.instant('Cancel');
  hideCheckBox = false;
  isSubmitEnabled = false;
  secondaryCheckBox = false;
  secondaryCheckBoxMsg = '';
  method: ApiMethod;
  data: unknown;
  tooltip: string;
  hideCancel = false;
  customSubmit: () => void;

  @Output() switchSelectionEmitter = new EventEmitter<boolean>();

  constructor(public dialogRef: MatDialogRef<ConfirmDialogComponent>, protected translate: TranslateService) {
  }

  toggleSubmit(data: MatCheckboxChange): void {
    this.isSubmitEnabled = data.checked;
  }

  secondaryCheckBoxEvent(): void {
    this.switchSelectionEmitter.emit(this.secondaryCheckBox);
  }

  isDisabled(): boolean {
    if (!this.hideCheckBox) {
      return !this.isSubmitEnabled && !this.hideCheckBox;
    }
    return this.secondaryCheckBox ? !this.isSubmitEnabled : false;
  }
}
