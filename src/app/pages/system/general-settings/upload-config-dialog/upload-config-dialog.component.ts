import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Validators, ReactiveFormsModule, NonNullableFormBuilder,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogTitle, MatDialogClose } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFileInputComponent } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { UploadService } from 'app/services/upload.service';

@UntilDestroy()
@Component({
  selector: 'ix-upload-config-dialog',
  templateUrl: './upload-config-dialog.component.html',
  styleUrls: ['./upload-config-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    IxFileInputComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class UploadConfigDialog {
  protected readonly requiredRoles = [Role.FullAdmin];

  form = this.formBuilder.group({
    config: [null as File[] | null, Validators.required],
  });

  readonly helptext = helptext;

  constructor(
    private formBuilder: NonNullableFormBuilder,
    private router: Router,
    private translate: TranslateService,
    private upload: UploadService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
  ) {}

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
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.router.navigate(['/system-tasks/restart'], { skipLocationChange: true });
      });
  }
}
