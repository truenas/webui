import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { Certificate } from 'app/interfaces/certificate.interface';

@Component({
  selector: 'ix-force-delete-certificate',
  templateUrl: './confirm-force-delete-dialog.component.html',
  styleUrls: ['./confirm-force-delete-dialog.component.scss'],
})
export class ConfirmForceDeleteCertificateComponent {
  form = this.formBuilder.group({
    force: [false],
  });
  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<ConfirmForceDeleteCertificateComponent>,
    @Inject(MAT_DIALOG_DATA) protected data: { cert: Certificate },
  ) { }

  onSubmit(): void {
    this.dialogRef.close({ force: this.form.get('force').value });
  }
}
