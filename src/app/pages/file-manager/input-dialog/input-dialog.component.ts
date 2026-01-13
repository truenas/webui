import {
  ChangeDetectionStrategy, Component, inject, OnInit,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { TestDirective } from 'app/modules/test-id/test.directive';

export interface InputDialogConfig {
  title: string;
  message?: string;
  inputLabel?: string;
  value?: string;
  required?: boolean;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'ix-input-dialog',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    TranslateModule,
    TestDirective,
  ],
  templateUrl: './input-dialog.component.html',
  styleUrls: ['./input-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputDialogComponent implements OnInit {
  private dialogRef = inject<MatDialogRef<InputDialogComponent, string | null>>(MatDialogRef);
  config = inject<InputDialogConfig>(MAT_DIALOG_DATA);

  inputControl = new FormControl<string>('', { nonNullable: true });

  ngOnInit(): void {
    if (this.config.value) {
      this.inputControl.setValue(this.config.value);
    }

    if (this.config.required !== false) {
      this.inputControl.addValidators(Validators.required);
    }
  }

  onConfirm(): void {
    if (this.inputControl.valid) {
      this.dialogRef.close(this.inputControl.value);
    }
  }
}
