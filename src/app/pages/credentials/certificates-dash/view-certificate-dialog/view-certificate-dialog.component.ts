import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TnDialogShellComponent } from '@truenas/ui-components';
import { MatButton } from '@angular/material/button';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
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
  imports: [
    TnDialogShellComponent,
    TestDirective,
    CopyButtonComponent,
    MatButton,
    TranslateModule,
  ],
})
export class ViewCertificateDialog {
  private download = inject(DownloadService);
  dialogRef = inject<DialogRef<unknown, ViewCertificateDialog>>(DialogRef);
  data = inject<ViewCertificateDialogData>(DIALOG_DATA);


  onDownloadPressed(): void {
    const fileName = `${this.data.name}.${this.data.extension}`;
    const blob = new Blob([this.data.certificate], { type: this.data.mimeType });

    this.download.downloadBlob(blob, fileName);
  }
}
