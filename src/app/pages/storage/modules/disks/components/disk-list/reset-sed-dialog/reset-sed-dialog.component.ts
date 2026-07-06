import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCheckboxComponent, TnDialogShellComponent, TnFormFieldComponent, TnIconComponent,
  TnInputComponent,
} from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-reset-sed-dialog',
  templateUrl: './reset-sed-dialog.component.html',
  styleUrls: ['./reset-sed-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TnFormFieldComponent,
    TnInputComponent,
    ReactiveFormsModule,
    TnCheckboxComponent,
    TnIconComponent,
    FormActionsComponent,
    TnButtonComponent,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class ResetSedDialog {
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private loader = inject(LoaderService);
  private snackbar = inject(SnackbarService);
  protected dialogRef = inject<DialogRef<unknown, ResetSedDialog>>(DialogRef);
  private destroyRef = inject(DestroyRef);
  protected data = inject<{ diskName: string }>(DIALOG_DATA);

  protected readonly Role = Role;

  protected form = this.formBuilder.nonNullable.group({
    psid: ['', [Validators.required]],
    confirm: [false, [Validators.requiredTrue]],
  });

  protected onSubmit(): void {
    this.api.call('disk.reset_sed', [{ name: this.data.diskName, psid: this.form.getRawValue().psid }])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('SED disk reset successfully'));
        this.dialogRef.close(true);
      });
  }
}
