import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import helptext_replication from 'app/helptext/data-protection/replication/replication';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { AppLoaderService, WebSocketService } from 'app/services';
import { DatasetService } from 'app/services/dataset-service/dataset.service';

@UntilDestroy()
@Component({
  templateUrl: './replication-restore-dialog.component.html',
  styleUrls: ['./replication-restore-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplicationRestoreDialogComponent {
  form = this.formBuilder.group({
    name: ['', Validators.required],
    target_dataset: ['', Validators.required],
  });

  readonly treeNodeProvider = this.datasetService.getDatasetNodeProvider();
  readonly helptext = helptext_replication;

  constructor(
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private formBuilder: FormBuilder,
    private datasetService: DatasetService,
    private dialogRef: MatDialogRef<ReplicationRestoreDialogComponent>,
    private errorHandler: FormErrorHandlerService,
    @Inject(MAT_DIALOG_DATA) private parentTaskId: number,
  ) {}

  onSubmit(): void {
    this.loader.open();

    this.ws.call('replication.restore', [this.parentTaskId, this.form.value])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.loader.close();
          this.dialogRef.close();
        },
        error: (error) => {
          this.loader.close();
          this.errorHandler.handleWsFormError(error, this.form);
        },
      });
  }
}
