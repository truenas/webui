import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'temperature-meter',
  templateUrl: './temperature-meter.component.html',
  styleUrls: ['./temperature-meter.component.css']
})
export class TemperatureMeterComponent implements OnInit {

  @Input('source') source: string;
  @Input('symbolText') symbolText: string;
  @Input('unit') unit: string;
  @Input('value') value: number;

  constructor() { }

  ngOnInit(): void {
  }

}
