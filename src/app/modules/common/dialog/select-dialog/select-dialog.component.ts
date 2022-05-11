import { Component, Output, EventEmitter } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Option } from 'app/interfaces/option.interface';

@Component({
  selector: 'ix-select-dialog',
  templateUrl: './select-dialog.component.html',
  styleUrls: ['./select-dialog.component.scss'],
})
export class SelectDialogComponent {
  title: string;
  options: Option[];
  optionPlaceHolder: string;
  displaySelection: string;
  @Output() switchSelectionEmitter = new EventEmitter<string | number>();

  constructor(public dialogRef: MatDialogRef<SelectDialogComponent>) {}

  switchSelection(): void {
    this.switchSelectionEmitter.emit(this.displaySelection);
  }
}
