import {
  ChangeDetectionStrategy, Component,
  input,
} from '@angular/core';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { TranslatedString } from 'app/modules/translate/translate.helper';

@Component({
  selector: 'ix-label',
  templateUrl: './ix-label.component.html',
  styleUrls: ['./ix-label.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TooltipComponent],
})
export class IxLabelComponent {
  readonly label = input<TranslatedString>();
  readonly required = input(false);
  readonly tooltip = input<TranslatedString>();
}
