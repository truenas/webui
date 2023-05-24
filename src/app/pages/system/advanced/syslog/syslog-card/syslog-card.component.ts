import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
import { syslogLevelLabels } from 'app/enums/syslog.enum';
import { LoadingState, toLoadingState } from 'app/helpers/to-loading-state.helper';
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

  syslog$: Observable<LoadingState<unknown>>;

  readonly syslogLevelLabels = syslogLevelLabels;

  constructor(
    private store$: Store<AppState>,
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private advancedSettings: AdvancedSettingsService,
  ) {}

  async onConfigurePressed(): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();
    const slideInRef = this.slideInService.open(SyslogFormComponent);
    this.syslog$ = slideInRef.slideInClosed$.pipe(
      startWith(undefined),
      switchMap(() => this.ws.call('systemdataset.config')),
      map((config) => config.syslog),
      toLoadingState(),
    );
  }
}
