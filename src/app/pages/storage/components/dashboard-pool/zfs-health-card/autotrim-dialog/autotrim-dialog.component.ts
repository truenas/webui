import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { OnOff } from 'app/enums/on-off.enum';
import helptext from 'app/helptext/storage/volumes/volume-list';
import { Pool } from 'app/interfaces/pool.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './autotrim-dialog.component.html',
  styleUrls: ['./autotrim-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutotrimDialogComponent implements OnInit {
  autotrimControl = new FormControl(false);

  readonly helptext = helptext;

  constructor(
    private loader: AppLoaderService,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialogRef: MatDialogRef<AutotrimDialogComponent>,
    private dialogService: DialogService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public pool: Pool,
  ) { }

  ngOnInit(): void {
    this.autotrimControl.setValue(this.pool.autotrim.value === 'on');
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.ws.job('pool.update', [this.pool.id, { autotrim: this.autotrimControl.value ? OnOff.On : OnOff.Off }])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe({
        complete: () => {
          this.snackbar.success(
            this.translate.instant('Pool options for {poolName} successfully saved.', { poolName: this.pool.name }),
          );
          this.dialogRef.close(true);
        },
      });
  }
}
