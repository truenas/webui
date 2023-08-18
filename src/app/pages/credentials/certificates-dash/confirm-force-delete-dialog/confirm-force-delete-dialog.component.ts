import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { Certificate } from 'app/interfaces/certificate.interface';

@Component({
  templateUrl: './confirm-force-delete-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmForceDeleteCertificateComponent {
  form = this.formBuilder.group({
    force: [false],
  });
  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<ConfirmForceDeleteCertificateComponent>,
    @Inject(MAT_DIALOG_DATA) protected data: Certificate,
  ) { }

  onSubmit(): void {
    this.dialogRef.close({ force: this.form.controls.force.value });
  }
}
