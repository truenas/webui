import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { TranslatedString } from 'app/modules/translate/translate.helper';

@Component({
  selector: 'ix-fieldset',
  templateUrl: './ix-fieldset.component.html',
  styleUrls: ['./ix-fieldset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TooltipComponent,
    TranslateModule,
  ],
})
export class IxFieldsetComponent {
  readonly title = input<TranslatedString>('');
  readonly tooltip = input<TranslatedString>('');
}
