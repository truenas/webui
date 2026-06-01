import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TnDialogShellComponent } from '@truenas/ui-components';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';

import { TranslateModule } from '@ngx-translate/core';
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
    MatButton,
    TestDirective,
  ],
})
export class LogsDetailsDialog {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    tail_lines: [500, [Validators.required]],
  });
}
