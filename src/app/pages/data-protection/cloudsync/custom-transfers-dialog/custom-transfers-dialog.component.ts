import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogRef, MatDialogTitle, MatDialogClose } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { helptextCloudSync } from 'app/helptext/data-protection/cloudsync/cloudsync';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-custom-transfers-dialog',
  templateUrl: './custom-transfers-dialog.component.html',
  styleUrls: ['./custom-transfers-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    IxInputComponent,
    FormActionsComponent,
    MatButton,
    MatDialogClose,
    TestDirective,
    TranslateModule,
  ],
})
export class CustomTransfersDialogComponent {
  readonly helptext = helptextCloudSync;
  readonly transfers = this.formBuilder.control(null as number, [Validators.required, Validators.min(0)]);

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<CustomTransfersDialogComponent>,
  ) { }

  onSave(): void {
    this.dialogRef.close(this.transfers.value);
  }
}
