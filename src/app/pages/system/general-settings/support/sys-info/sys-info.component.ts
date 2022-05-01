import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-sys-info',
  templateUrl: './sys-info.component.html',
})
export class SysInfoComponent {
  @Input() version: string;
  @Input() model: string;
  @Input() product: string;
  @Input() memory: string;
  @Input() serial: string;
  @Input() FN_instructions: string;
  @Input() hasLicense: boolean;

  // Additional fields for licensed customers
  @Input() customer_name: string;
  @Input() features: string[];
  @Input() contract_type: string;
  @Input() expiration_date: string;
  @Input() add_hardware: string;
  @Input() daysLeftinContract: number;
}
