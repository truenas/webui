import {
  Component,
} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-unlock';
import { DatasetUnlockParams } from 'app/interfaces/dataset-lock.interface';
import {
  DatasetUnlockComponent,
} from 'app/pages/datasets/modules/encryption/components/dataset-unlock/dataset-unlock.component';
import { DialogService } from 'app/services/dialog.service';

@Component({
  templateUrl: './unlock-summary-dialog.component.html',
  styleUrls: ['./unlock-summary-dialog.component.scss'],
})
export class UnlockSummaryDialogComponent {
  title: string = helptext.unlock_dataset_dialog.title;
  errorsMessage: string = helptext.unlock_dataset_dialog.errors_message;
  unlockMessage: string = helptext.unlock_dataset_dialog.unlock_message;
  buttonMessage: string = helptext.unlock_dataset_dialog.ok_button;
  cancelMessage: string = helptext.unlock_dataset_dialog.cancel_button;
  skippedMessage: string = helptext.unlock_result_dialog.skipped_message;
  unlockDatasets: { name: string }[] = [];
  errorDatasets: { name: string; unlock_error?: string }[] = [];
  skippedDatasets: { name: string }[] = [];
  tooltip: string;
  hideCancel = false;
  final = false;
  data = {} as DatasetUnlockParams;
  parent: DatasetUnlockComponent;

  constructor(
    public dialogRef: MatDialogRef<UnlockSummaryDialogComponent>,
    private dialogService: DialogService,
  ) {}

  submit(): void {
    this.dialogRef.close(true);
    this.parent.dialogOpen = false;
    if (this.final) {
      this.parent.goBack();
    } else {
      this.parent.unlockSubmit(this.data);
    }
  }

  showFinalResults(): void {
    this.final = true;
    this.errorsMessage = helptext.unlock_result_dialog.errors_message;
    this.unlockMessage = helptext.unlock_result_dialog.unlock_message;
  }

  cancel(): void {
    this.dialogRef.close(false);
    this.parent.dialogOpen = false;
    if (this.final) {
      this.parent.goBack();
    }
  }

  showError(dataset: { name: string; unlock_error?: string }): void {
    if (this.dialogService && dataset.unlock_error) {
      this.dialogService.warn(
        helptext.unlock_dataset_dialog.error_dialog_title + dataset.name,
        dataset.unlock_error,
      );
    }
  }
}
