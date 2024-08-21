import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject,
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EMPTY, switchMap } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { helptextDownloadKey } from 'app/helptext/storage/volumes/download-key';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

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
})
export class DownloadKeyDialogComponent {
  protected helptext = helptextDownloadKey;
  protected wasDownloaded = false;

  private filename: string;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    private download: DownloadService,
    private dialog: DialogService,
    @Inject(MAT_DIALOG_DATA) private data: DownloadKeyDialogParams,
  ) {
    this.filename = `dataset_${this.data.name}_keys.json`;
  }

  downloadKey(): void {
    this.ws.call('core.download', ['pool.dataset.export_keys', [this.data.name], this.filename]).pipe(
      tap(() => this.loader.open()),
      switchMap(([, url]) => {
        return this.download.streamDownloadFile(url, this.filename, 'application/json').pipe(
          tap((file) => {
            this.download.downloadBlob(file, this.filename);
            this.allowDoneButtonToBeClicked();
          }),
          catchError((error: HttpErrorResponse) => {
            this.dialog.error(this.errorHandler.parseHttpError(error));
            this.allowDoneButtonToBeClicked();
            return EMPTY;
          }),
        );
      }),
      untilDestroyed(this),
    ).subscribe({
      error: (error) => {
        this.loader.close();
        this.dialog.error(this.errorHandler.parseError(error));
      },
      complete: () => this.loader.close(),
    });
  }

  private allowDoneButtonToBeClicked(): void {
    this.wasDownloaded = true;
    this.cdr.markForCheck();
  }
}
