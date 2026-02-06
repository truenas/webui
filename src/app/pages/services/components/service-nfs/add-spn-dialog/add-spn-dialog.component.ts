import { ChangeDetectionStrategy, Component, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogRef, MatDialogTitle, MatDialogClose } from '@angular/material/dialog';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { CloudSyncRestoreDialog } from 'app/pages/data-protection/cloudsync/cloudsync-restore-dialog/cloudsync-restore-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-add-spn-dialog',
  templateUrl: './add-spn-dialog.component.html',
  styleUrls: ['./add-spn-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    IxInputComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatDialogClose,
    TranslateModule,
  ],
})
export class AddSpnDialog {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private dialogRef = inject<MatDialogRef<CloudSyncRestoreDialog>>(MatDialogRef);
  private snackbar = inject(SnackbarService);
  private loader = inject(LoaderService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SharingNfsWrite];

  readonly form = this.formBuilder.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    const value = this.form.getRawValue();
    const payload = {
      username: value.username,
      password: value.password,
    };

    this.api.call('nfs.add_principal', [payload])
      .pipe(
        this.errorHandler.withErrorHandler(),
        this.loader.withLoader(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Credentials have been successfully added.'));
        this.dialogRef.close();
      });
  }
}
