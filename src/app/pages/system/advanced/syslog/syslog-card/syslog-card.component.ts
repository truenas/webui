import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { SyslogFormComponent } from 'app/pages/system/advanced/syslog/syslog-form/syslog-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@Component({
  selector: 'ix-syslog-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './syslog-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyslogCardComponent {
  constructor(
    private slideIn: IxSlideInService,
    private advancedSettings: AdvancedSettingsService,
  ) {}

  async onConfigurePressed(): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();
    this.slideIn.open(SyslogFormComponent);
  }
}
