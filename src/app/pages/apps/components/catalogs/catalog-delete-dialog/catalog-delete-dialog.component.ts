import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Catalog } from 'app/interfaces/catalog.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './catalog-delete-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogDeleteDialogComponent {
  readonly deleteMessage = T('Are you sure you want to delete catalog <b>"{name}"</b>?');

  constructor(
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private dialogRef: MatDialogRef<CatalogDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public catalog: Catalog,
    private errorHandler: ErrorHandlerService,
  ) { }

  onDelete(): void {
    this.ws.call('catalog.delete', [this.catalog.id])
      .pipe(
        this.errorHandler.catchError(),
        this.loader.withLoader(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Catalog deleted'));
        this.dialogRef.close(true);
      });
  }
}
