import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { TokenSettingsComponent } from 'app/pages/system/advanced/sessions/token-settings/token-settings.component';
import { DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@Component({
  selector: 'ix-sessions-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './sessions-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionsCardComponent {
  constructor(
    private slideIn: IxSlideInService,
    private dialog: DialogService,
    private translate: TranslateService,
    private advancedSettings: AdvancedSettingsService,
  ) {}

  async onConfigure(): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();
    this.slideIn.open(TokenSettingsComponent);
  }

  onTerminateOtherSessions(): void {

  }
}
