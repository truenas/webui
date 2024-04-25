import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';

@Component({
  selector: 'ix-widget-datapoint',
  templateUrl: './widget-datapoint.component.html',
  styleUrl: './widget-datapoint.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetDatapointComponent {
  size = input.required<SlotSize>();
  label = input<string>();
  text = input<string>();
  subText = input<string>();

  get maxFontSize(): number {
    const isQuarter = this.size() === SlotSize.Quarter;
    let fontSize = isQuarter ? 18 : 20;

    if (this.text().length <= 15) {
      fontSize = isQuarter ? 35 : 49;
    } else if (this.text().length <= 30) {
      fontSize = isQuarter ? 25 : 30;
    } else if (this.text().length <= 40) {
      fontSize = isQuarter ? 20 : 22;
    }

    return fontSize;
  }
}
