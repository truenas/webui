import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  standalone: true,
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
export class AppDeleteDialogComponent {
  form = this.formBuilder.group({
    remove_volumes: [false],
    remove_images: [true],
    confirm: [false, [Validators.requiredTrue]],
  });

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<AppDeleteDialogComponent, AppDeleteDialogOutputData>,
    @Inject(MAT_DIALOG_DATA) protected data: AppDeleteDialogInputData,
  ) { }

  onSubmit(): void {
    if (this.form.value.confirm) {
      this.dialogRef.close({
        removeVolumes: this.form.value.remove_volumes,
        removeImages: this.form.value.remove_images,
      });
    }
  }
}
