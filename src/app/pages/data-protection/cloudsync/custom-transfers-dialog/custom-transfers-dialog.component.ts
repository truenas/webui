import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { helptextCloudSync } from 'app/helptext/data-protection/cloudsync/cloudsync';

@UntilDestroy()
@Component({
  templateUrl: './custom-transfers-dialog.component.html',
  styleUrls: ['./custom-transfers-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomTransfersDialogComponent {
  readonly helptext = helptextCloudSync;
  readonly transfers = this.formBuilder.control(null as number, [Validators.required, Validators.min(0)]);

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<CustomTransfersDialogComponent>,
  ) { }

  onSave(): void {
    this.dialogRef.close(this.transfers.value);
  }
}
