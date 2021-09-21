import { Component, Input } from '@angular/core';

@Component({
  selector: 'temperature-meter',
  templateUrl: './temperature-meter.component.html',
  styleUrls: ['./temperature-meter.component.scss'],
})
export class TemperatureMeterComponent {
  @Input() source: string;
  @Input() symbolText: string;
  @Input() unit: string;
  @Input() value: number;
}
