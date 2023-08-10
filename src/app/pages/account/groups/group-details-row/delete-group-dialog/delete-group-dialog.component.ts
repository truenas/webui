import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Group } from 'app/interfaces/group.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './delete-group-dialog.component.html',
  styleUrls: ['./delete-group-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteGroupDialogComponent {
  deleteUsersCheckbox = new FormControl(false);

  readonly deleteMessage = T('Are you sure you want to delete group <b>"{name}"</b>?');

  constructor(
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private dialogRef: MatDialogRef<DeleteGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public group: Group,
    private errorHandler: ErrorHandlerService,
  ) { }

  get deleteUsersMessage(): string {
    return this.translate.instant(
      'Delete {n, plural, one {# user} other {# users}} with this primary group?',
      { n: this.group.users.length },
    );
  }

  onDelete(): void {
    this.ws.call('group.delete', [this.group.id, { delete_users: this.deleteUsersCheckbox.value }])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Group deleted'));
        this.dialogRef.close(true);
      });
  }
}
