import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { format } from 'date-fns';
import helptext from 'app/helptext/storage/volumes/volume-list';
import { CreateZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './create-snapshot-dialog.component.html',
  styleUrls: ['./create-snapshot-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateSnapshotDialogComponent implements OnInit {
  form = this.fb.group({
    name: [this.getDefaultSnapshotName(), Validators.required],
    recursive: [false],
    vmware_sync: [false],
  });

  hasVmsInDataset = false;

  readonly tooltips = {
    name: helptext.snapshotDialog_name_tooltip,
    recursive: helptext.snapshotDialog_recursive_tooltip,
  };

  constructor(
    private ws: WebSocketService,
    private errorHandler: FormErrorHandlerService,
    private dialogRef: MatDialogRef<CreateSnapshotDialogComponent>,
    private fb: FormBuilder,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private dialog: DialogService,
    @Inject(MAT_DIALOG_DATA) public rowId: string,
  ) {}

  ngOnInit(): void {
    this.checkForVmsInDataset();

    this.form.controls['recursive'].valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => this.checkForVmsInDataset());
  }

  onSubmit(): void {
    this.loader.open();
    const values = this.form.value;

    const params: CreateZfsSnapshot = {
      dataset: this.rowId,
      name: values.name,
      recursive: values.recursive,
    };
    if (this.hasVmsInDataset) {
      params.vmware_sync = values.vmware_sync;
    }

    this.ws.call('zfs.snapshot.create', [params])
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.dialog.info(
          this.translate.instant('Create Snapshot'),
          this.translate.instant('Snapshot successfully taken.'),
          '500px',
          'info',
        );
        this.loader.close();
        this.dialogRef.close();
      }, (error) => {
        this.loader.close();
        this.errorHandler.handleWsFormError(error, this.form);
      });
  }

  private getDefaultSnapshotName(): string {
    const datetime = format(new Date(), 'yyyy-MM-dd_HH-mm');
    return `manual-${datetime}`;
  }

  private checkForVmsInDataset(): void {
    this.ws.call('vmware.dataset_has_vms', [this.rowId, this.form.controls['recursive'].value])
      .pipe(untilDestroyed(this))
      .subscribe((hasVmsInDataset) => {
        this.hasVmsInDataset = hasVmsInDataset;
      });
  }
}
