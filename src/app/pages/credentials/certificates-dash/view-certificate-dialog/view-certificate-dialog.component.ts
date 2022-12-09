import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import {
  ViewCertificateDialogData,
} from 'app/pages/credentials/certificates-dash/view-certificate-dialog/view-certificate-dialog-data.interface';
import { StorageService } from 'app/services';

@Component({
  templateUrl: './view-certificate-dialog.component.html',
  styleUrls: ['./view-certificate-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewCertificateDialogComponent {
  constructor(
    private storage: StorageService,
    public dialogRef: MatDialogRef<ViewCertificateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ViewCertificateDialogData,
  ) {}

  onDownloadPressed(): void {
    const fileName = `${this.data.name}.${this.data.extension}`;

    this.storage.downloadText(this.data.certificate, fileName);
  }
}
