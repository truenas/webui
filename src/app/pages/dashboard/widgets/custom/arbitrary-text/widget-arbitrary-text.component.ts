import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import {
  SlotSize,
} from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import { WidgetArbitraryTextSettings } from 'app/pages/dashboard/widgets/custom/arbitrary-text/widget-arbitrary-text.definition';

@Component({
  selector: 'ix-widget-arbitrary-text',
  templateUrl: './widget-arbitrary-text.component.html',
  styleUrls: ['./widget-arbitrary-text.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [WidgetDatapointComponent, TranslateModule],
})
export class WidgetArbitraryTextComponent implements WidgetComponent {
  size = input.required<SlotSize>();
  settings = input.required<WidgetArbitraryTextSettings>();
}
