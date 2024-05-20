import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import {
  SlotSize,
} from 'app/pages/dashboard/types/widget.interface';
import { WidgetArbitraryTextSettings } from 'app/pages/dashboard/widgets/custom/arbitrary-text/widget-arbitrary-text.definition';

@Component({
  selector: 'ix-widget-arbitrary-text',
  templateUrl: './widget-arbitrary-text.component.html',
  styleUrls: ['./widget-arbitrary-text.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetArbitraryTextComponent implements WidgetComponent {
  size = input.required<SlotSize>();
  settings = input.required<WidgetArbitraryTextSettings>();
}
