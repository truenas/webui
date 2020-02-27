import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Component, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'app-select-dialog',
  templateUrl: './select-dialog.component.html',
  styleUrls : [ './select-dialog.component.scss' ]
})
export class SelectDialogComponent {

  public title: string;
  public options: Array<{ label: string, value: string }>;
  public optionPlaceHolder: string;
  public method: string;
  public params: string;
  public DisplaySelection: string;
  @Output() switchSelectionEmitter = new EventEmitter<any>();


  constructor(public dialogRef: MatDialogRef < SelectDialogComponent >, protected translate: TranslateService ) {}

  switchSelection(){
    this.switchSelectionEmitter.emit(this.DisplaySelection);
  }

}
