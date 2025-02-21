import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogRef, MatDialogTitle, MatDialogClose } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { CloudSyncRestoreDialogComponent } from 'app/pages/data-protection/cloudsync/cloudsync-restore-dialog/cloudsync-restore-dialog.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-add-spn-dialog',
  templateUrl: './add-spn-dialog.component.html',
  styleUrls: ['./add-spn-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
export class AddSpnDialogComponent {
  protected readonly requiredRoles = [Role.SharingNfsWrite];

  readonly form = this.formBuilder.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<CloudSyncRestoreDialogComponent>,
    private snackbar: SnackbarService,
    private loader: AppLoaderService,
  ) { }

  onSubmit(): void {
    const value = this.form.getRawValue();
    const payload = {
      username: value.username,
      password: value.password,
    };

    this.api.call('nfs.add_principal', [payload])
      .pipe(
        this.errorHandler.catchError(),
        this.loader.withLoader(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Credentials have been successfully added.'));
        this.dialogRef.close();
      });
  }
}
