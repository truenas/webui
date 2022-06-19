import { Component, Input } from '@angular/core';

@Component({
  selector: 'ix-sys-info',
  templateUrl: './sys-info.component.html',
})
export class SysInfoComponent {
  @Input() version: string;
  @Input() model: string;
  @Input() product: string;
  @Input() memory: string;
  @Input() serial: string;
  @Input() fnInstructions: string;
  @Input() hasLicense: boolean;

  // Additional fields for licensed customers
  @Input() customerName: string;
  @Input() features: string[];
  @Input() contractType: string;
  @Input() expirationDate: string;
  @Input() addHardware: string;
  @Input() daysLeftinContract: number;
}
