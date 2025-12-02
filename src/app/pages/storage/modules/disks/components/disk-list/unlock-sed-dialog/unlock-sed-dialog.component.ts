import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogClose, MatDialogContent, MatDialogActions,
} from '@angular/material/dialog';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-unlock-sed-dialog',
  templateUrl: './unlock-sed-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    ReactiveFormsModule,
    IxInputComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class UnlockSedDialog {
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private loader = inject(LoaderService);
  private snackbar = inject(SnackbarService);
  private dialogRef = inject<MatDialogRef<UnlockSedDialog>>(MatDialogRef);
  private destroyRef = inject(DestroyRef);
  protected data = inject<{ diskName: string }>(MAT_DIALOG_DATA);

  protected readonly Role = Role;

  protected form = this.formBuilder.nonNullable.group({
    password: ['', [Validators.required]],
  });

  protected onSubmit(): void {
    this.api.call('disk.unlock_sed', [{ name: this.data.diskName, password: this.form.getRawValue().password }])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('SED disk unlocked successfully'));
        this.dialogRef.close(true);
      });
  }
}
