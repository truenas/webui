import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

export interface CameraNameDialogData {
  name: string;
  room: string;
}

export interface CameraNameDialogResult {
  name: string;
  room: string | null;
}

@Component({
  selector: 'ix-camera-name-dialog',
  templateUrl: './camera-name-dialog.component.html',
  styleUrl: './camera-name-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatFormField,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    TranslateModule,
  ],
})
export class CameraNameDialogComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly dialogRef = inject<MatDialogRef<CameraNameDialogComponent, CameraNameDialogResult>>(MatDialogRef);
  private readonly data = inject<CameraNameDialogData>(MAT_DIALOG_DATA);

  protected readonly form = this.fb.group({
    room: [this.data.room],
    name: [this.data.name, Validators.required],
  });

  protected close(): void {
    this.dialogRef.close();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.dialogRef.close({
      name: value.name.trim(),
      room: value.room.trim() || null,
    });
  }
}
