import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import {
  ReplicationSettingsFormComponent,
} from 'app/pages/system/advanced/replication/replication-settings-form/replication-settings-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@Component({
  selector: 'ix-replication-settings-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './replication-settings-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplicationSettingsCardComponent {
  constructor(
    private slideIn: IxSlideInService,
    private advancedSettings: AdvancedSettingsService,
  ) {}

  async onConfigurePressed(): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();
    this.slideIn.open(ReplicationSettingsFormComponent);
  }
}
