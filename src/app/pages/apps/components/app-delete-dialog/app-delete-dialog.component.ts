import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import {
  MAT_DIALOG_DATA, MatDialogRef,
} from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { AppDeleteDialogInputData, AppDeleteDialogOutputData } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.interface';

@UntilDestroy()
@Component({
  selector: 'ix-app-delete-dialog',
  templateUrl: './app-delete-dialog.component.html',
  styleUrls: ['./app-delete-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDeleteDialogComponent {
  form = this.formBuilder.group({
    removeVolumes: [false],
    removeImages: [true],
    forceRemoveVolumes: [false],
  });

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<AppDeleteDialogComponent, AppDeleteDialogOutputData>,
    @Inject(MAT_DIALOG_DATA) protected data: AppDeleteDialogInputData,
  ) { }

  onSubmit(): void {
    this.dialogRef.close(this.form.getRawValue());
  }
}
