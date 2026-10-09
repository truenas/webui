import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  scopeTestId, TnCardComponent, TnTestIdDirective, type TnTestIdValue,
} from '@truenas/ui-components';
import { Ng2FittextModule } from 'ng2-fittext';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';

@Component({
  selector: 'ix-widget-datapoint',
  templateUrl: './widget-datapoint.component.html',
  styleUrl: './widget-datapoint.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnTestIdDirective,
    Ng2FittextModule,
    TranslateModule,
  ],
})
export class WidgetDatapointComponent {
  size = input.required<SlotSize>();
  /**
   * Base of every readout id in the card. This component backs a dozen widget types, several of
   * which can sit on one dashboard at once, so a static id here would repeat across all of them.
   */
  testId = input.required<TnTestIdValue>();
  label = input<string>('');
  /**
   * Free-form user text shown under the label. Not translated.
   */
  description = input<string>('');
  text = input.required<string>();
  subText = input<string>();

  protected readonly testIds = computed(() => ({
    title: scopeTestId(this.testId(), 'title'),
    description: scopeTestId(this.testId(), 'description'),
    value: scopeTestId(this.testId(), 'value'),
    subText: scopeTestId(this.testId(), 'sub-text'),
  }));

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
