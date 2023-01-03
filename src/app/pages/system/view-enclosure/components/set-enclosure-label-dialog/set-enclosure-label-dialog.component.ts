import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EntityUtils } from 'app/modules/entity/utils';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';

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
  form = this.formBuilder.group({
    label: ['', Validators.required],
    resetToDefault: [false],
  });

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private dialogRef: MatDialogRef<SetEnclosureLabelDialogComponent, string>,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) private data: SetEnclosureLabelDialogData,
  ) { }

  ngOnInit(): void {
    this.form.patchValue({
      label: this.data.currentLabel,
    });

    this.setFormRelationship();
  }

  onSubmit(): void {
    this.loader.open();
    const formValues = this.form.value;
    const newLabel = formValues.resetToDefault ? this.data.defaultLabel : formValues.label;

    this.ws.call('enclosure.update', [this.data.enclosureId, { label: newLabel }])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.loader.close();
          this.dialogRef.close(newLabel);
        },
        error: (error) => {
          this.loader.close();
          new EntityUtils().handleWsError(this, error, this.dialogService);
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
