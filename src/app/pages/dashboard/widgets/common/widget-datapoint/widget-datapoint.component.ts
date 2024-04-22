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
}
