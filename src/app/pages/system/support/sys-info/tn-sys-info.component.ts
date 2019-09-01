import { Component, Input, } from '@angular/core';

@Component({
  selector: 'app-tn-sys-info',
  templateUrl: './tn-sys-info.component.html',
  styleUrls: ['./tn-sys-info.component.css']
})
export class TnSysInfoComponent {
  @Input() customer_name;
  @Input() features;
  @Input() contract_type;
  @Input() expiration_date;
  @Input() model;
  @Input() sys_serial;
  @Input() add_hardware;
  @Input() daysLeftinContract;

  constructor() { }
}
