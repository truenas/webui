import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogClose, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppDeleteDialogInputData, AppDeleteDialogOutputData } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.interface';

@UntilDestroy()
@Component({
  selector: 'ix-app-delete-dialog',
  templateUrl: './app-delete-dialog.component.html',
  styleUrls: ['./app-delete-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatDialogTitle,
    MatDialogClose,
    ReactiveFormsModule,
    FormActionsComponent,
    IxCheckboxComponent,
    IxInputComponent,
    TestDirective,
    TranslateModule,
  ],
})
export class AppDeleteDialog {
  private formBuilder = inject(FormBuilder);
  private dialogRef = inject<MatDialogRef<AppDeleteDialog, AppDeleteDialogOutputData>>(MatDialogRef);
  protected data = inject<AppDeleteDialogInputData>(MAT_DIALOG_DATA);
  private translate = inject(TranslateService);
  private validators = inject(IxValidatorsService);
  protected readonly deleteMessage = signal(this.translate.instant('The <i><b>{name}</b></i> application will be permanently deleted.', { name: this.data.name }));
  protected readonly deleteAppHelpText = signal(this.translate.instant('Enter <b>{name}</b> below to confirm.', { name: this.data.name }));

  form = this.formBuilder.nonNullable.group({
    removeVolumes: [false],
    removeImages: [true],
    forceRemoveVolumes: [false],
    confirmAppName: ['', [Validators.required, this.validators.confirmValidator(
      this.data.name,
      this.translate.instant('Enter application name to continue.'),
    )]],
  });

  onSubmit(): void {
    this.dialogRef.close(this.form.getRawValue());
  }
}
