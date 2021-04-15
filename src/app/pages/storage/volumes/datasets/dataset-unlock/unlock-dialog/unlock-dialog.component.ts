import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  Component, Output, EventEmitter, OnInit,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import helptext from '../../../../../../helptext/storage/volumes/datasets/dataset-unlock';
import { T } from '../../../../../../translate-marker';

@Component({
  selector: 'app-unlock-dialog',
  templateUrl: './unlock-dialog.component.html',
  styleUrls: ['./unlock-dialog.component.css'],
})
export class UnlockDialogComponent {
  title: string = helptext.unlock_dataset_dialog.title;
  errors_title: string = helptext.unlock_dataset_dialog.errors;
  errors_message: string = helptext.unlock_dataset_dialog.errors_message;
  unlock_title: string = helptext.unlock_dataset_dialog.unlock;
  unlock_message: string = helptext.unlock_dataset_dialog.unlock_message;
  buttonMsg: string = helptext.unlock_dataset_dialog.ok_button;
  cancelMsg: string = helptext.unlock_dataset_dialog.cancel_button;
  skipped_message: string = helptext.unlock_result_dialog.skipped_message;
  unlock_datasets = [];
  error_datasets = [];
  skipped_datasets = [];
  tooltip: string;
  hideCancel = false;
  final = false;
  data = {};
  parent: any;

  @Output() switchSelectionEmitter = new EventEmitter<any>();

  constructor(public dialogRef: MatDialogRef < UnlockDialogComponent >, protected translate: TranslateService) {
  }

  submit() {
    this.dialogRef.close(true);
    this.parent.dialogOpen = false;
    if (this.final) {
      this.parent.go_back();
    } else {
      this.parent.unlockSubmit(this.data);
    }
  }

  show_final_results() {
    this.final = true;
    this.errors_message = helptext.unlock_result_dialog.errors_message;
    this.unlock_message = helptext.unlock_result_dialog.unlock_message;
  }

  cancel() {
    this.dialogRef.close(false);
    this.parent.dialogOpen = false;
  }

  showError(dataset) {
    if (this.parent.dialogService && dataset.unlock_error) {
      this.parent.dialogService.Info(helptext.unlock_dataset_dialog.error_dialog_title + dataset.name, dataset.unlock_error);
    }
  }
}
