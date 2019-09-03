import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-tn-sys-info',
  templateUrl: './tn-sys-info.component.html',
  styleUrls: ['./tn-sys-info.component.css']
})
export class TnSysInfoComponent implements OnInit {
  is_freenas: boolean;
  @Input() customer_name;
  @Input() features;
  @Input() contract_type;
  @Input() expiration_date;
  @Input() model;
  @Input() sys_serial;
  @Input() add_hardware;
  @Input() daysLeftinContract;

  constructor() { }

  ngOnInit() {
    window.localStorage['is_freenas'] === 'true' ? this.is_freenas = true : this.is_freenas = false;
  }
}
