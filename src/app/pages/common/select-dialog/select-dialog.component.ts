import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-select-dialog',
  templateUrl: './select-dialog.component.html',
  styleUrls: ['./select-dialog.component.scss'],
})
export class SelectDialogComponent {
  title: string;
  options: { label: string; value: string }[];
  optionPlaceHolder: string;
  method: string;
  params: string;
  DisplaySelection: string;
  @Output() switchSelectionEmitter = new EventEmitter<any>();

  constructor(public dialogRef: MatDialogRef < SelectDialogComponent >, protected translate: TranslateService) {}

  switchSelection() {
    this.switchSelectionEmitter.emit(this.DisplaySelection);
  }
}
