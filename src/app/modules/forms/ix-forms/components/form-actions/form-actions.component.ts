import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ix-form-actions',
  templateUrl: './form-actions.component.html',
  styleUrls: ['./form-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormActionsComponent {
  readonly validating = input(false);
}
