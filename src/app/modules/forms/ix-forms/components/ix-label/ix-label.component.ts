import {
  ChangeDetectionStrategy, Component,
  input,
} from '@angular/core';

@Component({
  selector: 'ix-label',
  templateUrl: './ix-label.component.html',
  styleUrls: ['./ix-label.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxLabelComponent {
  readonly label = input<string>();
  readonly required = input(false);
  readonly tooltip = input<string>();
}
