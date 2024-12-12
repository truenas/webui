import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { Ng2FittextModule } from 'ng2-fittext';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';

@Component({
  selector: 'ix-widget-datapoint',
  templateUrl: './widget-datapoint.component.html',
  styleUrl: './widget-datapoint.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    Ng2FittextModule,
    TranslateModule,
  ],
})
export class WidgetDatapointComponent {
  size = input.required<SlotSize>();
  label = input<string>();
  text = input<string>();
  subText = input<string>();

  get maxFontSize(): number {
    const isQuarter = this.size() === SlotSize.Quarter;
    let fontSize = isQuarter ? 15 : 20;

    if (this.text().length <= 15) {
      fontSize = isQuarter ? 30 : 49;
    } else if (this.text().length <= 30) {
      fontSize = isQuarter ? 20 : 30;
    } else if (this.text().length <= 40) {
      fontSize = isQuarter ? 18 : 22;
    }

    return fontSize;
  }
}
