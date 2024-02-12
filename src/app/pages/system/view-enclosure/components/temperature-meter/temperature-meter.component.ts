import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ix-temperature-meter',
  templateUrl: './temperature-meter.component.html',
  styleUrls: ['./temperature-meter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemperatureMeterComponent {
  @Input() source: string;
  @Input() symbolText: string;
  @Input() unit: string;
  @Input() value: number;
}
