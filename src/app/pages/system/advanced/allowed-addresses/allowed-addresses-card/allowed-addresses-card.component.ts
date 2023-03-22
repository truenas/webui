import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import {
  AllowedAddressesFormComponent,
} from 'app/pages/system/advanced/allowed-addresses/allowed-addresses-form/allowed-addresses-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@Component({
  selector: 'ix-allowed-addresses-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './allowed-addresses-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllowedAddressesCardComponent {
  constructor(
    private slideIn: IxSlideInService,
    private advancedSettings: AdvancedSettingsService,
  ) {}

  async onConfigure(): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();
    this.slideIn.open(AllowedAddressesFormComponent);
  }
}
