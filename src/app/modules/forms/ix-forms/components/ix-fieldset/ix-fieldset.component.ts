import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';

@Component({
  selector: 'ix-fieldset',
  templateUrl: './ix-fieldset.component.html',
  styleUrls: ['./ix-fieldset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxFieldsetComponent {
  readonly disable = input<boolean>();
  readonly title = input<string>();
  readonly divider = input<boolean>();
  readonly tooltip = input<string>();
}
