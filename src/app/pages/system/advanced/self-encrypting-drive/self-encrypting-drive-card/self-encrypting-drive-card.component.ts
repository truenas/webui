import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { SelfEncryptingDriveFormComponent } from 'app/pages/system/advanced/self-encrypting-drive/self-encrypting-drive-form/self-encrypting-drive-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@Component({
  selector: 'ix-self-encrypting-drive-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './self-encrypting-drive-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelfEncryptingDriveCardComponent {
  constructor(
    private slideIn: IxSlideInService,
    private advancedSettings: AdvancedSettingsService,
  ) {}

  async onConfigure(): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();
    // TODO: Set form.
    this.slideIn.open(SelfEncryptingDriveFormComponent);
  }
}
