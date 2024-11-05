import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';

@Component({
  selector: 'ix-fieldset',
  templateUrl: './ix-fieldset.component.html',
  styleUrls: ['./ix-fieldset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TooltipComponent,
    MatDivider,
    TranslateModule,
  ],
})
export class IxFieldsetComponent {
  readonly disable = input<boolean>();
  readonly title = input<string>();
  readonly tooltip = input<string>();
}
