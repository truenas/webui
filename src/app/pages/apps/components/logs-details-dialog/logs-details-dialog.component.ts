import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-logs-details-dialog',
  templateUrl: './logs-details-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TranslateModule,
    ReactiveFormsModule,
    IxInputComponent,
    TnButtonComponent,
    TestDirective,
  ],
})
export class LogsDetailsDialog {
  protected dialogRef = inject<DialogRef<unknown, LogsDetailsDialog>>(DialogRef);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    tail_lines: [500, [Validators.required]],
  });
}
