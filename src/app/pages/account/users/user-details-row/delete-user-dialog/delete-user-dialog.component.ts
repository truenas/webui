import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { User } from 'app/interfaces/user.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './delete-user-dialog.component.html',
  styleUrls: ['./delete-user-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteUserDialogComponent implements OnInit {
  deleteGroupCheckbox = new FormControl(false);
  isLastGroupMember = false;

  readonly deleteMessage = T('Are you sure you want to delete user <b>"{user}"</b>?');

  constructor(
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public user: User,
    private dialogRef: MatDialogRef<DeleteUserDialogComponent>,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.checkIfLastGroupMember();
  }

  onDelete(): void {
    this.ws.call('user.delete', [this.user.id, { delete_group: this.deleteGroupCheckbox.value }])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('User deleted'));
        this.dialogRef.close(true);
      });
  }

  private checkIfLastGroupMember(): void {
    this.ws.call('group.query', [[['id', '=', this.user.group.id]]])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe((groups) => {
        this.isLastGroupMember = groups[0].users.length === 1;
        this.cdr.markForCheck();
      });
  }
}
