import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { getLabelForContractType } from 'app/interfaces/system-info.interface';
import {
  IxSlideToggleComponent,
} from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { LicenseInfoInSupport } from 'app/pages/system/general-settings/support/license-info-in-support.interface';
import { SystemInfoInSupport } from 'app/pages/system/general-settings/support/system-info-in-support.interface';

@Component({
  selector: 'ix-sys-info',
  templateUrl: './sys-info.component.html',
  styleUrls: ['../../common-settings-card.scss', './sys-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatListModule,
    ReactiveFormsModule,
    IxSlideToggleComponent,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class SysInfoComponent {
  readonly hasLicense = input<boolean>();
  readonly licenseInfo = input<LicenseInfoInSupport>();
  readonly systemInfo = input.required<SystemInfoInSupport>();
  readonly productionControl = input<FormControl<boolean>>();
  readonly isProactiveSupportEnabled = input<boolean>(false);

  readonly editContacts = output();

  protected readonly requiredRoles = [Role.FullAdmin];
  protected readonly getLabelForContractType = getLabelForContractType;
}
