import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TnDialogShellComponent } from '@truenas/ui-components';
import { Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { DialogRef } from '@angular/cdk/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { helptextCloudSync } from 'app/helptext/data-protection/cloudsync/cloudsync';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-custom-transfers-dialog',
  templateUrl: './custom-transfers-dialog.component.html',
  styleUrls: ['./custom-transfers-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    ReactiveFormsModule,
    IxInputComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class CustomTransfersDialog {
  private dialogRef = inject<DialogRef<unknown, CustomTransfersDialog>>(DialogRef);

  readonly helptext = helptextCloudSync;
  readonly transfers = new FormControl(null as number | null, [Validators.required, Validators.min(0)]);

  onSave(): void {
    this.dialogRef.close(this.transfers.value);
  }
}
