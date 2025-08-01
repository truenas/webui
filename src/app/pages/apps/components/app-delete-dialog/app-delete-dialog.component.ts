import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogClose, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
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
    TestDirective,
    TranslateModule,
  ],
})
export class AppDeleteDialog {
  private formBuilder = inject(FormBuilder);
  private dialogRef = inject<MatDialogRef<AppDeleteDialog, AppDeleteDialogOutputData>>(MatDialogRef);
  protected data = inject<AppDeleteDialogInputData>(MAT_DIALOG_DATA);

  form = this.formBuilder.nonNullable.group({
    removeVolumes: [false],
    removeImages: [true],
    forceRemoveVolumes: [false],
  });

  onSubmit(): void {
    this.dialogRef.close(this.form.getRawValue());
  }
}
