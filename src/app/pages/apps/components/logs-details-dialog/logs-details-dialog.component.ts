import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnDialogShellComponent, TnFormFieldComponent, TnInputComponent,
} from '@truenas/ui-components';

@Component({
  selector: 'ix-logs-details-dialog',
  templateUrl: './logs-details-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TranslateModule,
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnInputComponent,
    TnButtonComponent,
  ],
})
export class LogsDetailsDialog {
  protected dialogRef = inject<DialogRef<unknown, LogsDetailsDialog>>(DialogRef);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    tail_lines: [500, [Validators.required]],
  });
}
