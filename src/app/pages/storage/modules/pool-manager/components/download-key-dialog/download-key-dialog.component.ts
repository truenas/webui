import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogClose,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { helptextDownloadKey } from 'app/helptext/storage/volumes/download-key';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface DownloadKeyDialogParams {
  id: number;
  name: string;
}

@UntilDestroy()
@Component({
  selector: 'ix-download-key-dialog',
  templateUrl: './download-key-dialog.component.html',
  styleUrls: ['./download-key-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    MatDialogClose,
    TranslateModule,
  ],
})
export class DownloadKeyDialog {
  private errorHandler = inject(ErrorHandlerService);
  private loader = inject(LoaderService);
  private download = inject(DownloadService);
  private data = inject<DownloadKeyDialogParams>(MAT_DIALOG_DATA);

  protected helptext = helptextDownloadKey;
  protected wasDownloaded = signal(false);

  private filename: string;

  constructor() {
    this.filename = `dataset_${this.data.name}_keys.json`;
  }

  downloadKey(): void {
    this.loader.open();

    this.download.coreDownload({
      method: 'pool.dataset.export_keys',
      arguments: [this.data.name],
      fileName: this.filename,
      mimeType: 'application/json',
    })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => this.wasDownloaded.set(true),
        error: (error: unknown) => {
          this.wasDownloaded.set(true);
          this.loader.close();
          this.errorHandler.showErrorModal(error);
        },
        complete: () => this.loader.close(),
      });
  }
}
