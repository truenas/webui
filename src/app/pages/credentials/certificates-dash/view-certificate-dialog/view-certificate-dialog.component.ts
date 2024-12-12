import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogActions,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  ViewCertificateDialogData,
} from 'app/pages/credentials/certificates-dash/view-certificate-dialog/view-certificate-dialog-data.interface';
import { DownloadService } from 'app/services/download.service';

@Component({
  selector: 'ix-view-certificate-dialog',
  templateUrl: './view-certificate-dialog.component.html',
  styleUrls: ['./view-certificate-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    TestDirective,
    MatDialogActions,
    CopyButtonComponent,
    MatButton,
    TranslateModule,
  ],
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
