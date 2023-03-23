import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { map, startWith, switchMap } from 'rxjs/operators';
import { syslogLevelLabels } from 'app/enums/syslog.enum';
import { toLoadingState } from 'app/helpers/to-loading-state.helper';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { SyslogFormComponent } from 'app/pages/system/advanced/syslog/syslog-form/syslog-form.component';
import { WebSocketService } from 'app/services';
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
  readonly advancedConfig$ = this.store$.pipe(
    waitForAdvancedConfig,
    toLoadingState(),
  );

  readonly syslog$ = this.slideIn.onClose$.pipe(
    startWith(undefined),
    switchMap(() => this.ws.call('systemdataset.config')),
    map((config) => config.syslog),
    toLoadingState(),
  );

  readonly syslogLevelLabels = syslogLevelLabels;

  constructor(
    private store$: Store<AppState>,
    private ws: WebSocketService,
    private slideIn: IxSlideInService,
    private advancedSettings: AdvancedSettingsService,
  ) {}

  async onConfigurePressed(): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();
    this.slideIn.open(SyslogFormComponent);
  }
}
