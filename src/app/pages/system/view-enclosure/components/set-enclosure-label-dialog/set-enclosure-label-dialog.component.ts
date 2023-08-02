import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

export interface SetEnclosureLabelDialogData {
  enclosureId: string;
  currentLabel: string;
  defaultLabel: string;
}

@UntilDestroy()
@Component({
  templateUrl: './set-enclosure-label-dialog.component.html',
  styleUrls: ['./set-enclosure-label-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
        error: (error: WebsocketError) => {
          this.dialogService.error(this.errorHandler.parseWsError(error));
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
