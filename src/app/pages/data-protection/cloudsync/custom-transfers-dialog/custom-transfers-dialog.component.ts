import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnDialogShellComponent, TnFormFieldComponent, TnInputComponent,
  InputType,
} from '@truenas/ui-components';
import { helptextCloudSync } from 'app/helptext/data-protection/cloudsync/cloudsync';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';

@Component({
  selector: 'ix-custom-transfers-dialog',
  templateUrl: './custom-transfers-dialog.component.html',
  styleUrls: ['./custom-transfers-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnInputComponent,
    FormActionsComponent,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class CustomTransfersDialog {
  protected readonly InputType = InputType;
  protected dialogRef = inject<DialogRef<unknown, CustomTransfersDialog>>(DialogRef);

  readonly helptext = helptextCloudSync;
  readonly transfers = new FormControl(null as number | null, [Validators.required, Validators.min(0)]);

  onSave(): void {
    this.dialogRef.close(this.transfers.value);
  }
}
