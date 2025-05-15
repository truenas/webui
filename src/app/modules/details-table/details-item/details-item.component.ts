import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { TranslatedString } from 'app/modules/translate/translate.helper';

@Component({
  selector: 'ix-details-item',
  templateUrl: './details-item.component.html',
  styleUrl: './details-item.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TooltipComponent,
  ],
})
export class DetailsItemComponent {
  label = input<TranslatedString>('');
  tooltip = input<TranslatedString>('');
}
