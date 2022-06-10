import { Component, Input } from '@angular/core';
import { LicenseInfoInSupport } from 'app/pages/system/general-settings/support/license-info-in-support.interface';
import { SystemInfoInSupport } from 'app/pages/system/general-settings/support/system-info-in-support.interface';

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
  @Input() FN_instructions: string;
  @Input() hasLicense: boolean;

  // Additional fields for licensed customers
  @Input() customer_name: string;
  @Input() features: string[];
  @Input() contract_type: string;
  @Input() expiration_date: string;
  @Input() add_hardware: string;
  @Input() daysLeftinContract: number;
  //
  @Input() sys_info: SystemInfoInSupport;
  @Input() license_info: LicenseInfoInSupport;
}
