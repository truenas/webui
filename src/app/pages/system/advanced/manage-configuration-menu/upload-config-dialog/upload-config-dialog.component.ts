import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Validators, ReactiveFormsModule, NonNullableFormBuilder,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFileInputComponent } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { UploadService } from 'app/services/upload.service';

@Component({
  selector: 'ix-upload-config-dialog',
  templateUrl: './upload-config-dialog.component.html',
  styleUrls: ['./upload-config-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    ReactiveFormsModule,
    IxFileInputComponent,
    FormActionsComponent,
    TnButtonComponent,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class UploadConfigDialog {
  private formBuilder = inject(NonNullableFormBuilder);
  protected dialogRef = inject<DialogRef<unknown, UploadConfigDialog>>(DialogRef);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private upload = inject(UploadService);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.FullAdmin];

  form = this.formBuilder.group({
    config: [null as File[] | null, Validators.required],
  });

  readonly helptext = helptext;

  onSubmit(): void {
    this.dialogService
      .jobDialog(
        this.upload.uploadAsJob({
          file: this.form.value.config[0],
          method: 'config.upload',
        }),
        { title: this.translate.instant('Uploading and Applying Config') },
      )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.router.navigate(['/system-tasks/restart'], { skipLocationChange: true });
      });
  }
}
