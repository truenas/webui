import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  ViewCertificateDialogData,
} from 'app/pages/credentials/certificates-dash/view-certificate-dialog/view-certificate-dialog-data.interface';
import { DownloadService } from 'app/services/download.service';

@Component({
  templateUrl: './view-certificate-dialog.component.html',
  styleUrls: ['./view-certificate-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewCertificateDialogComponent {
  constructor(
    private download: DownloadService,
    public dialogRef: MatDialogRef<ViewCertificateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ViewCertificateDialogData,
  ) {}

  onDownloadPressed(): void {
    const fileName = `${this.data.name}.${this.data.extension}`;

    this.download.downloadText(this.data.certificate, fileName);
  }
}
