import { ChangeDetectionStrategy, Component, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogClose } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { AclPreset } from 'app/pages/acl-prototype/acl-prototype.component';

export interface PresetSelectionModalData {
  presets: AclPreset[];
}

@Component({
  selector: 'ix-preset-selection-modal',
  templateUrl: './preset-selection-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogClose,
    ReactiveFormsModule,
    IxRadioGroupComponent,
    IxSelectComponent,
    FormActionsComponent,
    MatButton,
    TranslateModule,
  ],
})
export class PresetSelectionModalComponent {
  private dialogRef = inject(MatDialogRef<PresetSelectionModalComponent>);
  private data = inject<PresetSelectionModalData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  readonly form = this.fb.group({
    usePreset: [true],
    presetName: [''],
  });

  constructor() {
    // Set up conditional validation for presetName
    // eslint-disable-next-line rxjs-angular/prefer-takeuntil -- using takeUntilDestroyed
    this.form.controls.usePreset.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((usePreset) => {
      if (usePreset) {
        this.form.controls.presetName.setValidators([Validators.required]);
      } else {
        this.form.controls.presetName.setValidators([]);
      }
      this.form.controls.presetName.updateValueAndValidity();
    });

    // Initialize validation
    this.form.controls.presetName.setValidators([Validators.required]);
  }

  readonly usePresetOptions$ = of([
    {
      label: 'Select a preset ACL',
      tooltip: 'Choosing an entry loads a preset ACL that is configured to match general permissions situations.',
      value: true,
    },
    {
      label: 'Create a custom ACL',
      value: false,
    },
  ]);

  readonly presetOptions$ = of(
    this.data.presets.map((preset) => ({
      label: preset.name,
      value: preset.name,
      description: preset.description,
    })),
  );

  onContinuePressed(): void {
    const { usePreset, presetName } = this.form.value;

    if (!usePreset) {
      // User wants to create custom ACL
      this.dialogRef.close(null);
      return;
    }

    const selectedPreset = this.data.presets.find((preset) => preset.name === presetName);
    if (!selectedPreset) {
      return;
    }

    this.dialogRef.close(selectedPreset);
  }
}
