import { Component, Input } from '@angular/core';

@Component({
  selector: 'temperature-meter',
  templateUrl: './temperature-meter.component.html',
  styleUrls: ['./temperature-meter.component.scss'],
})
export class TemperatureMeterComponent {
  @Input('source') source: string;
  @Input('symbolText') symbolText: string;
  @Input('unit') unit: string;
  @Input('value') value: number;
}
