import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogActions, MatDialogClose, MatDialogTitle } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-logs-details-dialog',
  templateUrl: './logs-details-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    IxInputComponent,
    MatButton,
    TestDirective,
    MatDialogClose,
    MatDialogTitle,
    MatDialogActions,
  ],
})
export class LogsDetailsDialogComponent {
  form = this.fb.group({
    tail_lines: [500, [Validators.required]],
  });

  constructor(
    private fb: FormBuilder,
  ) {}
}
