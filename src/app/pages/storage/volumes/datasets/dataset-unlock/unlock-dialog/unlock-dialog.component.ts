import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Component, Output, EventEmitter, OnInit} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import helptext from '../../../../../../helptext/storage/volumes/datasets/dataset-unlock';
import { T } from '../../../../../../translate-marker';

@Component({
  selector: 'app-unlock-dialog',
  templateUrl: './unlock-dialog.component.html',
  styleUrls : [ './unlock-dialog.component.css' ],
})
export class UnlockDialogComponent {

  public title: string = helptext.unlock_dataset_dialog.title;
  public errors_title: string = helptext.unlock_dataset_dialog.errors;
  public errors_message: string = helptext.unlock_dataset_dialog.errors_message;
  public unlock_title: string = helptext.unlock_dataset_dialog.unlock;
  public unlock_message: string = helptext.unlock_dataset_dialog.unlock_message;
  public buttonMsg: string = helptext.unlock_dataset_dialog.ok_button;
  public cancelMsg: string = helptext.unlock_dataset_dialog.cancel_button;
  public unlock_datasets = [];
  public error_datasets = [];
  public tooltip: string;
  public hideCancel = false;
  public data = {};
  public parent: any;

  @Output() switchSelectionEmitter = new EventEmitter<any>();

  constructor(public dialogRef: MatDialogRef < UnlockDialogComponent >, protected translate: TranslateService ) {
  }

  submit() {
    this.dialogRef.close(true);
    this.parent.unlockSubmit(this.data);
  }

  showError(dataset) {
    if (this.parent.dialogService && dataset.unlock_error) {
      this.parent.dialogService.Info(helptext.unlock_dataset_dialog.error_dialog_title + dataset.name, dataset.unlock_error);
    }
  }

}
