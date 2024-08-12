import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'ix-set-tail-lines-dialog',
  templateUrl: './set-tail-lines-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetTailLinesDialogComponent {
  form = this.fb.group({
    tail_lines: [500, [Validators.required]],
  });

  constructor(
    private fb: FormBuilder,
  ) {}
}
