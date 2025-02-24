import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
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
import { User } from 'app/interfaces/user.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-delete-user-dialog',
  templateUrl: './delete-user-dialog.component.html',
  styleUrls: ['./delete-user-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    IxCheckboxComponent,
    TestOverrideDirective,
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
export class DeleteUserDialogComponent implements OnInit {
  protected readonly requiredRoles = [Role.AccountWrite];

  deleteGroupCheckbox = new FormControl(false, { nonNullable: true });
  isLastGroupMember = false;

  readonly deleteMessage = T('Are you sure you want to delete user <b>"{user}"</b>?');

  constructor(
    private errorHandler: ErrorHandlerService,
    private api: ApiService,
    private loader: AppLoaderService,
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
    this.api.call('user.delete', [this.user.id, { delete_group: this.deleteGroupCheckbox.value }])
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
    this.api.call('group.query', [[['id', '=', this.user.group.id]]])
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
