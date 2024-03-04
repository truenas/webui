import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { helptextUnlock } from 'app/helptext/storage/volumes/datasets/dataset-unlock';
import { DatasetUnlockParams } from 'app/interfaces/dataset-lock.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  DatasetUnlockComponent,
} from 'app/pages/datasets/modules/encryption/components/dataset-unlock/dataset-unlock.component';

@Component({
  templateUrl: './unlock-summary-dialog.component.html',
  styleUrls: ['./unlock-summary-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnlockSummaryDialogComponent {
  title: string = helptextUnlock.unlock_dataset_dialog.title;
  errorsMessage: string = helptextUnlock.unlock_dataset_dialog.errors_message;
  unlockMessage: string = helptextUnlock.unlock_dataset_dialog.unlock_message;
  buttonMessage: string = helptextUnlock.unlock_dataset_dialog.ok_button;
  cancelMessage: string = helptextUnlock.unlock_dataset_dialog.cancel_button;
  skippedMessage: string = helptextUnlock.unlock_result_dialog.skipped_message;
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
    this.errorsMessage = helptextUnlock.unlock_result_dialog.errors_message;
    this.unlockMessage = helptextUnlock.unlock_result_dialog.unlock_message;
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
        helptextUnlock.unlock_dataset_dialog.error_dialog_title + dataset.name,
        dataset.unlock_error,
      );
    }
  }
}
