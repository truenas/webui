import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { helptextUnlock } from 'app/helptext/storage/volumes/datasets/dataset-unlock';
import { DatasetUnlockParams } from 'app/interfaces/dataset-lock.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  DatasetUnlockComponent,
} from 'app/pages/datasets/modules/encryption/components/dataset-unlock/dataset-unlock.component';

@Component({
  selector: 'ix-unlock-summary-dialog',
  templateUrl: './unlock-summary-dialog.component.html',
  styleUrls: ['./unlock-summary-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    TranslateModule,
    MatDialogContent,
    MatDivider,
    TestDirective,
    IxIconComponent,
    FormActionsComponent,
    MatButton,
  ],
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
