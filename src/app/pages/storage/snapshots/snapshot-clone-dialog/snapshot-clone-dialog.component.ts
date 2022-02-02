import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import helptext from 'app/helptext/storage/snapshots/snapshots';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { AppLoaderService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './snapshot-clone-dialog.component.html',
  styleUrls: ['./snapshot-clone-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnapshotCloneDialogComponent implements OnInit {
  wasDatasetCloned = false;

  form = this.fb.group({
    dataset_dst: ['', Validators.required],
  });

  readonly tooltips = {
    dataset_dst: helptext.snapshot_clone_name_tooltip,
  };

  constructor(
    private ws: WebSocketService,
    private dialogRef: MatDialogRef<SnapshotCloneDialogComponent>,
    private loader: AppLoaderService,
    private fb: FormBuilder,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) private snapshotName: string,
  ) {}

  get datasetName(): string {
    return this.form.value['dataset_dst'];
  }

  ngOnInit(): void {
    this.setDatasetName();
  }

  onSubmit(): void {
    this.loader.open();

    this.ws.call('zfs.snapshot.clone', [{
      snapshot: this.snapshotName,
      dataset_dst: this.datasetName,
    }])
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.loader.close();
        this.wasDatasetCloned = true;
        this.cdr.markForCheck();
      }, (error) => {
        this.loader.close();
        this.errorHandler.handleWsFormError(error, this.form);
      });
  }

  private setDatasetName(): void {
    let suggestedName: string;
    if (this.snapshotName.includes('/')) {
      suggestedName = this.snapshotName.replace('@', '-') + '-clone';
    } else {
      suggestedName = this.snapshotName.replace('@', '/') + '-clone';
    }

    this.form.setValue({ dataset_dst: suggestedName });
  }
}
