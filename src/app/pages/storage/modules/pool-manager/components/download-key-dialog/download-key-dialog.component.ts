import {
  ChangeDetectionStrategy, Component, Inject,
  signal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogClose,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { EMPTY, switchMap } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { helptextDownloadKey } from 'app/helptext/storage/volumes/download-key';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

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
  standalone: true,
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
export class DownloadKeyDialogComponent {
  protected helptext = helptextDownloadKey;
  protected wasDownloaded = signal(false);

  private filename: string;

  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    private download: DownloadService,
    private dialog: DialogService,
    @Inject(MAT_DIALOG_DATA) private data: DownloadKeyDialogParams,
  ) {
    this.filename = `dataset_${this.data.name}_keys.json`;
  }

  downloadKey(): void {
    this.loader.open();

    this.api.call('core.download', ['pool.dataset.export_keys', [this.data.name], this.filename]).pipe(
      switchMap(([, url]) => {
        return this.download.streamDownloadFile(url, this.filename, 'application/json').pipe(
          tap((file) => {
            this.download.downloadBlob(file, this.filename);
            this.wasDownloaded.set(true);
          }),
          catchError((error: unknown) => {
            this.dialog.error(this.errorHandler.parseError(error));
            this.wasDownloaded.set(true);
            return EMPTY;
          }),
        );
      }),
      untilDestroyed(this),
    ).subscribe({
      error: (error: unknown) => {
        this.loader.close();
        this.dialog.error(this.errorHandler.parseError(error));
      },
      complete: () => this.loader.close(),
    });
  }
}
