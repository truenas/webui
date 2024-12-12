import {
  ChangeDetectionStrategy, Component,
  input,
} from '@angular/core';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';

@Component({
  selector: 'ix-label',
  templateUrl: './ix-label.component.html',
  styleUrls: ['./ix-label.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TooltipComponent],
})
export class IxLabelComponent {
  readonly label = input<string>();
  readonly required = input(false);
  readonly tooltip = input<string>();
}
