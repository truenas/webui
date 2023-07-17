import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { StaticRoute } from 'app/interfaces/static-route.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './static-route-delete-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaticRouteDeleteDialogComponent {
  readonly deleteMessage = T('Are you sure you want to delete static route <b>"{name}"</b>?');

  constructor(
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private dialogRef: MatDialogRef<StaticRouteDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public route: StaticRoute,
    private errorHandler: ErrorHandlerService,
  ) { }

  onDelete(): void {
    this.loader.open();
    this.ws.call('staticroute.delete', [this.route.id])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.snackbar.success(this.translate.instant('Static route deleted'));
          this.dialogRef.close(true);
          this.loader.close();
        },
        error: (error: WebsocketError) => {
          this.dialogService.error(this.errorHandler.parseWsError(error));
          this.loader.close();
        },
      });
  }
}
