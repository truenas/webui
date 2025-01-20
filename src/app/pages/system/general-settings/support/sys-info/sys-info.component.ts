import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { getLabelForContractType } from 'app/interfaces/system-info.interface';
import { LicenseInfoInSupport } from 'app/pages/system/general-settings/support/license-info-in-support.interface';
import { SystemInfoInSupport } from 'app/pages/system/general-settings/support/system-info-in-support.interface';

@Component({
  selector: 'ix-sys-info',
  templateUrl: './sys-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslateModule],
})
export class SysInfoComponent {
  readonly hasLicense = input<boolean>();
  readonly licenseInfo = input<LicenseInfoInSupport>();
  readonly systemInfo = input.required<SystemInfoInSupport>();

  protected readonly getLabelForContractType = getLabelForContractType;
}
