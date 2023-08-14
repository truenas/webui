import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  map, startWith, switchMap,
} from 'rxjs/operators';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { SelfEncryptingDriveFormComponent } from 'app/pages/system/advanced/self-encrypting-drive/self-encrypting-drive-form/self-encrypting-drive-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@Component({
  selector: 'ix-self-encrypting-drive-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './self-encrypting-drive-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelfEncryptingDriveCardComponent {
  readonly sedUser$ = this.store$.pipe(
    waitForAdvancedConfig,
    map((config) => config.sed_user),
    toLoadingState(),
  );

  sedPassword$ = this.slideInService.onClose$.pipe(
    startWith(undefined),
    switchMap(() => this.ws.call('system.advanced.sed_global_password')),
    map((sedPassword) => '*'.repeat(sedPassword.length) || '–'),
    toLoadingState(),
  );

  constructor(
    private store$: Store<AppState>,
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private advancedSettings: AdvancedSettingsService,
  ) {}

  async onConfigure(): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();
    this.slideInService.open(SelfEncryptingDriveFormComponent);
  }
}
