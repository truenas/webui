import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnButtonComponent, TnCheckboxComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { AppDeleteDialogInputData, AppDeleteDialogOutputData } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.interface';

@Component({
  selector: 'ix-app-delete-dialog',
  templateUrl: './app-delete-dialog.component.html',
  styleUrls: ['./app-delete-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TnButtonComponent,
    ReactiveFormsModule,
    FormActionsComponent,
    TnCheckboxComponent,
    IxInputComponent,
    TranslateModule,
  ],
})
export class AppDeleteDialog {
  private formBuilder = inject(FormBuilder);
  protected dialogRef = inject<DialogRef<AppDeleteDialogOutputData, AppDeleteDialog>>(DialogRef);
  protected data = inject<AppDeleteDialogInputData>(DIALOG_DATA);
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
