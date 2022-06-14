import { Component, Input } from '@angular/core';
import { LicenseInfoInSupport } from 'app/pages/system/general-settings/support/license-info-in-support.interface';
import { SystemInfoInSupport } from 'app/pages/system/general-settings/support/system-info-in-support.interface';

@Component({
  selector: 'ix-sys-info',
  templateUrl: './sys-info.component.html',
})
export class SysInfoComponent {
  @Input() has_license: boolean;
  @Input() license_info: LicenseInfoInSupport;
  @Input() system_info: SystemInfoInSupport;
}
