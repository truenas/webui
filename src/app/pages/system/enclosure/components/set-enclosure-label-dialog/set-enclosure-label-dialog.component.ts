import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogClose,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

export interface SetEnclosureLabelDialogData {
  enclosureId: string;
  currentLabel: string;
  defaultLabel: string;
}

@UntilDestroy()
@Component({
  selector: 'ix-set-enclosure-label-dialog',
  templateUrl: './set-enclosure-label-dialog.component.html',
  styleUrls: ['./set-enclosure-label-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    IxInputComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    MatDialogClose,
    TranslateModule,
  ],
})
export class SetEnclosureLabelDialogComponent implements OnInit {
  enclosureLabel = 'Enclosure Label';

  form = this.formBuilder.group({
    label: ['', [
      Validators.required,
      this.validatorsService.withMessage(
        Validators.pattern('^(?!\\s*$).+'),
        this.translate.instant(`${this.enclosureLabel} cannot contain only whitespace characters.`),
      )]],
    resetToDefault: [false],
  });

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private dialogRef: MatDialogRef<SetEnclosureLabelDialogComponent, string>,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private validatorsService: IxValidatorsService,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) private data: SetEnclosureLabelDialogData,
  ) { }

  ngOnInit(): void {
    this.form.patchValue({
      label: this.data.currentLabel,
    });

    this.setFormRelationship();
  }

  onSubmit(): void {
    const formValues = this.form.value;
    const newLabel = formValues.resetToDefault ? this.data.defaultLabel : formValues.label;

    this.ws.call('enclosure.update', [this.data.enclosureId, { label: newLabel }])
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: () => {
          this.dialogRef.close(newLabel);
        },
        error: (error: unknown) => {
          this.dialogService.error(this.errorHandler.parseError(error));
          this.dialogRef.close();
        },
      });
  }

  private setFormRelationship(): void {
    this.form.controls.resetToDefault.valueChanges.pipe(untilDestroyed(this)).subscribe((resetToDefault) => {
      if (resetToDefault) {
        this.form.controls.label.disable();
      } else {
        this.form.controls.label.enable();
      }
    });
  }
}
