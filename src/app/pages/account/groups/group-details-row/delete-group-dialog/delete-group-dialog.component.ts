import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Group } from 'app/interfaces/group.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services';
import { WebSocketService2 } from 'app/services/ws2.service';

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
    private ws: WebSocketService2,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private dialogRef: MatDialogRef<DeleteGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public group: Group,
  ) { }

  get deleteUsersMessage(): string {
    return this.translate.instant(
      'Delete {n, plural, one {# user} other {# users}} with this primary group?',
      { n: this.group.users.length },
    );
  }

  onDelete(): void {
    this.loader.open();
    this.ws.call('group.delete', [this.group.id, { delete_users: this.deleteUsersCheckbox.value }])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.snackbar.success(this.translate.instant('Group deleted'));
          this.dialogRef.close(true);
          this.loader.close();
        },
        error: (error) => {
          new EntityUtils().handleWsError(this, error, this.dialogService);
          this.loader.close();
        },
      });
  }
}
