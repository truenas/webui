import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Role } from 'app/enums/role.enum';
import { syslogLevelLabels } from 'app/enums/syslog.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { SyslogFormComponent } from 'app/pages/system/advanced/syslog/syslog-form/syslog-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@Component({
  selector: 'ix-syslog-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './syslog-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyslogCardComponent {
  protected requiredRoles = [Role.FullAdmin];

  readonly advancedConfig$ = this.store$.pipe(
    waitForAdvancedConfig,
    toLoadingState(),
  );

  readonly syslogLevelLabels = syslogLevelLabels;

  constructor(
    private store$: Store<AppState>,
    private slideInService: IxSlideInService,
    private advancedSettings: AdvancedSettingsService,
  ) {}

  async onConfigurePressed(): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();
    this.slideInService.open(SyslogFormComponent);
  }
}
