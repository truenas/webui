import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { Group } from 'app/interfaces/group.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-delete-group-dialog',
  templateUrl: './delete-group-dialog.component.html',
  styleUrls: ['./delete-group-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    IxCheckboxComponent,
    ReactiveFormsModule,
    FormActionsComponent,
    MatDialogActions,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class DeleteGroupDialogComponent {
  protected readonly requiredRoles = [Role.AccountWrite];

  deleteUsersCheckbox = new FormControl(false, { nonNullable: true });

  readonly deleteMessage = T('Are you sure you want to delete group <b>"{name}"</b>?');

  constructor(
    private loader: AppLoaderService,
    private api: ApiService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
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
    this.api.call('group.delete', [this.group.id, { delete_users: this.deleteUsersCheckbox.value }])
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
